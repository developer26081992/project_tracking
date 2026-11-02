import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { projectScope, validRecordId } from './project-access';
import type { OverviewData, ProjectDetail, ProjectSummary, TaskView } from './dashboard-types';
import type { Project, Task } from '@prisma/client';

async function currentIdentity() {
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHORIZED');
  return userId;
}

async function memberNames(ids: string[]) {
  const users = await prisma.user.findMany({
    where: { clerkUserId: { in: [...new Set(ids)] } },
    select: { clerkUserId: true, firstName: true, lastName: true },
  });
  return new Map(users.map((user) => [user.clerkUserId, [user.firstName, user.lastName].filter(Boolean).join(' ') || `Member ${user.clerkUserId.slice(-6)}`]));
}

function taskView(task: Task, project: Pick<Project, 'id' | 'name'>, names: Map<string, string>): TaskView {
  return {
    ...task, projectName: project.name,
    assigneeName: task.assignedId ? names.get(task.assignedId) ?? `Member ${task.assignedId.slice(-6)}` : null,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(),
  };
}

export async function getProjects(): Promise<ProjectSummary[]> {
  const scope = projectScope(await currentIdentity());
  const [projects, done] = await Promise.all([
    prisma.project.findMany({ where: scope, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], include: { _count: { select: { tasks: true, teamMembers: true } } } }),
    prisma.task.groupBy({ by: ['projectId'], where: { status: 'DONE', project: scope }, _count: { _all: true } }),
  ]);
  const doneCounts = new Map(done.map((group) => [group.projectId, group._count._all]));
  return projects.map((project) => ({
    id: project.id, name: project.name, description: project.description, status: project.status,
    createdAt: project.createdAt.toISOString(), taskCount: project._count.tasks,
    completedTaskCount: doneCounts.get(project.id) ?? 0, memberCount: project._count.teamMembers,
  }));
}

export async function getOverview(): Promise<OverviewData> {
  const userId = await currentIdentity();
  const [projects, recent] = await Promise.all([
    getProjects(),
    prisma.task.findMany({ where: { project: projectScope(userId) }, include: { project: { select: { id: true, name: true } } }, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: 8 }),
  ]);
  const names = await memberNames(recent.flatMap((task) => task.assignedId ? [task.assignedId] : []));
  const completedTasks = projects.reduce((sum, project) => sum + project.completedTaskCount, 0);
  return {
    projects, recentTasks: recent.map((task) => taskView(task, task.project, names)),
    stats: {
      projects: projects.length, activeProjects: projects.filter((project) => project.status === 'IN_PROGRESS').length,
      openTasks: projects.reduce((sum, project) => sum + project.taskCount, 0) - completedTasks, completedTasks,
    },
  };
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const userId = await currentIdentity();
  if (!validRecordId(id)) return null;
  const project = await prisma.project.findFirst({
    where: { id, ...projectScope(userId) },
    include: { tasks: { orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] }, teamMembers: { orderBy: { userId: 'asc' } } },
  });
  if (!project) return null;
  const names = await memberNames(project.teamMembers.map((member) => member.userId));
  return {
    id: project.id, name: project.name, description: project.description, status: project.status,
    createdAt: project.createdAt.toISOString(), taskCount: project.tasks.length,
    completedTaskCount: project.tasks.filter((task) => task.status === 'DONE').length, memberCount: project.teamMembers.length,
    tasks: project.tasks.map((task) => taskView(task, project, names)),
    members: project.teamMembers.map((member) => ({ ...member, name: names.get(member.userId) ?? `Member ${member.userId.slice(-6)}` })),
  };
}

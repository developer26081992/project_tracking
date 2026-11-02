import type { PrismaClient } from '@prisma/client';
import { TASK_PRIORITIES, TASK_STATUSES, type TaskActionResult } from './dashboard-types';
import { projectScope, validRecordId } from './project-access';

type TaskDatabase = Pick<PrismaClient, 'task' | '$transaction'>;
type ValidTask = {
  title: string; description: string; status: typeof TASK_STATUSES[number];
  priority: typeof TASK_PRIORITIES[number]; assignedId: string | null; dueDate: Date | null;
};

export function validateTaskInput(input: unknown): { ok: true; data: ValidTask } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Invalid task details.' };
  const fields = input as Record<string, unknown>;
  if (typeof fields.title !== 'string' || !fields.title.trim() || fields.title.trim().length > 200) {
    return { ok: false, error: 'Enter a task title between 1 and 200 characters.' };
  }
  if (typeof fields.description !== 'string' || fields.description.length > 5000) {
    return { ok: false, error: 'Description must be no longer than 5,000 characters.' };
  }
  if (!TASK_STATUSES.includes(fields.status as ValidTask['status'])) return { ok: false, error: 'Choose a valid task status.' };
  if (!TASK_PRIORITIES.includes(fields.priority as ValidTask['priority'])) return { ok: false, error: 'Choose a valid priority.' };
  if (typeof fields.assignedId !== 'string' || (fields.assignedId !== '' && !validRecordId(fields.assignedId))) {
    return { ok: false, error: 'Choose a valid project member.' };
  }
  if (typeof fields.dueDate !== 'string') return { ok: false, error: 'Choose a valid due date.' };
  let dueDate: Date | null = null;
  if (fields.dueDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.dueDate) || fields.dueDate < '1900-01-01' || fields.dueDate > '9999-12-31') {
      return { ok: false, error: 'Choose a valid due date.' };
    }
    dueDate = new Date(`${fields.dueDate}T00:00:00.000Z`);
    if (Number.isNaN(dueDate.getTime()) || dueDate.toISOString().slice(0, 10) !== fields.dueDate) {
      return { ok: false, error: 'Choose a valid calendar date.' };
    }
  }
  return {
    ok: true,
    data: {
      title: fields.title.trim(), description: fields.description.trim(),
      status: fields.status as ValidTask['status'], priority: fields.priority as ValidTask['priority'],
      assignedId: fields.assignedId || null, dueDate,
    },
  };
}

export async function changeTaskStatus(
  db: TaskDatabase, userId: string, projectId: unknown, taskId: unknown, status: unknown,
): Promise<TaskActionResult> {
  if (!userId) return { ok: false, error: 'Please sign in to update tasks.' };
  if (!validRecordId(projectId) || !validRecordId(taskId) || !TASK_STATUSES.includes(status as ValidTask['status'])) {
    return { ok: false, error: 'Invalid task or status.' };
  }
  // Authorization and project/task identity are part of the write, not a prior UI check.
  const result = await db.task.updateMany({
    where: { id: taskId, projectId, project: projectScope(userId) },
    data: { status: status as ValidTask['status'] },
  });
  return result.count === 1 ? { ok: true } : { ok: false, error: 'Task not found or you no longer have access to this project.' };
}

export async function insertTask(
  db: TaskDatabase, userId: string, projectId: unknown, input: unknown,
): Promise<TaskActionResult> {
  if (!userId) return { ok: false, error: 'Please sign in to create tasks.' };
  if (!validRecordId(projectId)) return { ok: false, error: 'Invalid project.' };
  const parsed = validateTaskInput(input);
  if (!parsed.ok) return parsed;

  return db.$transaction(async (tx) => {
    const project = await tx.project.findFirst({ where: { id: projectId, ...projectScope(userId) }, select: { id: true } });
    if (!project) return { ok: false, error: 'Project not found or you no longer have access.' };
    if (parsed.data.assignedId) {
      const member = await tx.teamMember.findUnique({
        where: { userId_projectId: { userId: parsed.data.assignedId, projectId } }, select: { userId: true },
      });
      if (!member) return { ok: false, error: 'The assignee must be a member of this project.' };
    }
    const { assignedId, ...fields } = parsed.data;
    const task = await tx.task.create({
      data: {
        ...fields,
        // Recheck access in the relation connect in case membership was revoked.
        project: { connect: { ...projectScope(userId), id: projectId } },
        ...(assignedId ? { assignee: { connect: { userId_projectId: { userId: assignedId, projectId } } } } : {}),
      },
      select: { id: true },
    });
    return { ok: true, taskId: task.id };
  });
}

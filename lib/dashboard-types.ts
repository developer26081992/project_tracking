export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskStatusValue = typeof TASK_STATUSES[number];
export type TaskPriorityValue = typeof TASK_PRIORITIES[number];

export type TaskView = {
  id: string; title: string; description: string;
  status: TaskStatusValue; priority: TaskPriorityValue;
  projectId: string; projectName: string; assignedId: string | null;
  assigneeName: string | null; dueDate: string | null;
  createdAt: string; updatedAt: string;
};
export type ProjectSummary = {
  id: string; name: string; description: string; status: string;
  createdAt: string; taskCount: number; completedTaskCount: number; memberCount: number;
};
export type ProjectDetail = ProjectSummary & {
  tasks: TaskView[];
  members: { userId: string; role: string; name: string }[];
};
export type OverviewData = {
  projects: ProjectSummary[]; recentTasks: TaskView[];
  stats: { projects: number; activeProjects: number; openTasks: number; completedTasks: number };
};
export type CreateTaskInput = {
  title: string; description: string; status: string; priority: string;
  assignedId: string; dueDate: string;
};
export type TaskActionResult = { ok: true; taskId?: string } | { ok: false; error: string };

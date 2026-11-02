'use client';
import { updateTaskStatus } from '../actions';
import type { TaskView } from '../../../lib/dashboard-types';
import { KanbanBoard } from './kanban-board';

export function ProjectBoard({ projectId, tasks }: { projectId: string; tasks: TaskView[] }) {
  return <KanbanBoard tasks={tasks} onMove={(taskId, status) => updateTaskStatus(projectId, taskId, status)} />;
}

'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { changeTaskStatus, insertTask } from '../../lib/task-service';
import type { CreateTaskInput, TaskActionResult } from '../../lib/dashboard-types';

function refreshProject(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath('/dashboard/projects');
  revalidatePath('/dashboard');
}

export async function updateTaskStatus(projectId: string, taskId: string, status: string): Promise<TaskActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Please sign in to update tasks.' };
  try {
    const result = await changeTaskStatus(prisma, userId, projectId, taskId, status);
    if (result.ok) refreshProject(projectId);
    return result;
  } catch {
    console.error('Task status update failed');
    return { ok: false, error: 'Your change could not be saved. Please try again.' };
  }
}

export async function createTask(projectId: string, input: CreateTaskInput): Promise<TaskActionResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Please sign in to create tasks.' };
  try {
    const result = await insertTask(prisma, userId, projectId, input);
    if (result.ok) refreshProject(projectId);
    return result;
  } catch {
    console.error('Task creation failed');
    return { ok: false, error: 'Your task could not be created. Check the project and assignee, then try again.' };
  }
}

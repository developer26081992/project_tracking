import type { Prisma } from '@prisma/client';

export function projectScope(clerkUserId: string): Prisma.ProjectWhereInput {
  return { OR: [{ ownerId: clerkUserId }, { teamMembers: { some: { userId: clerkUserId } } }] };
}

export function validRecordId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(value);
}

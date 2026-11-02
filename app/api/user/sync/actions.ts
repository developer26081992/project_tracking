'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';
import { createUserIfMissing } from '../../../../lib/user-record';

export async function syncUser() {
  // Never accept a user ID or profile from the caller.
  const { userId } = await auth();
  if (!userId) throw new Error('UNAUTHORIZED');

  const existing = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;

  const profile = await currentUser();
  if (!profile || profile.id !== userId) throw new Error('UNAUTHORIZED');
  return createUserIfMissing(prisma, profile);
}

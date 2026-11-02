import type { PrismaClient } from '@prisma/client';

export type ClerkProfile = {
  id: string;
  primaryEmailAddressId: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export async function createUserIfMissing(db: Pick<PrismaClient, 'user'>, profile: ClerkProfile) {
  try {
    return await db.user.upsert({
      where: { clerkUserId: profile.id },
      // A late user.created event must not overwrite an existing profile.
      update: {},
      create: {
        clerkUserId: profile.id,
        email: profile.emailAddresses.find((email) => email.id === profile.primaryEmailAddressId)?.emailAddress ?? null,
        firstName: profile.firstName,
        lastName: profile.lastName,
        imageUrl: profile.imageUrl,
      },
    });
  } catch (error) {
    // A webhook and the first dashboard request can create the same user at once.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return db.user.findUniqueOrThrow({ where: { clerkUserId: profile.id } });
    }
    throw error;
  }
}

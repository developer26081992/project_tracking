import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { syncUser } from './actions';

export const runtime = 'nodejs';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const user = await syncUser();
    return NextResponse.json({ user: { id: user.id, clerkUserId: user.clerkUserId } });
  } catch {
    console.error('Authenticated user synchronization failed');
    return NextResponse.json({ error: 'Unable to sync user. Please retry.' }, { status: 500 });
  }
}

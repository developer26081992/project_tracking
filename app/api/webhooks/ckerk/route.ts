import { NextResponse } from 'next/server';
import { verifyClerkWebhook } from '../../../../lib/clerk-webhook';
import { prisma } from '../../../../lib/prisma';
import { createUserIfMissing } from '../../../../lib/user-record';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEB_HOOK_SECRET || process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });

  let event;
  try {
    // Verify the original body before using any event data.
    event = verifyClerkWebhook(await request.text(), request.headers, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type !== 'user.created') return NextResponse.json({ received: true });

  try {
    const data = event.data;
    await createUserIfMissing(prisma, {
      id: data.id,
      primaryEmailAddressId: data.primary_email_address_id,
      emailAddresses: data.email_addresses.map((email) => ({ id: email.id, emailAddress: email.email_address })),
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url ?? null,
    });
    return NextResponse.json({ received: true });
  } catch {
    // Non-2xx allows Clerk to retry database failures.
    console.error('Clerk user.created persistence failed');
    return NextResponse.json({ error: 'Unable to persist user' }, { status: 500 });
  }
}

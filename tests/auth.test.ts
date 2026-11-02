import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Webhook } from 'svix';
import type { PrismaClient } from '@prisma/client';
import { verifyClerkWebhook } from '../lib/clerk-webhook';
import { createUserIfMissing } from '../lib/user-record';

const secret = `whsec_${Buffer.from('a-test-only-signing-secret-32byte').toString('base64')}`;
const payload = JSON.stringify({ type: 'user.created', data: { id: 'user_test' } });

function signedHeaders(body = payload, date = new Date()) {
  return new Headers({
    'svix-id': 'msg_test',
    'svix-timestamp': String(Math.floor(date.getTime() / 1000)),
    'svix-signature': new Webhook(secret).sign('msg_test', date, body),
  });
}

test('accepts a correctly signed Clerk event', () => {
  const event = verifyClerkWebhook(payload, signedHeaders(), secret);
  assert.equal(event.type, 'user.created');
  assert.equal(event.data.id, 'user_test');
});

test('rejects missing signatures, tampered bodies, wrong secrets and stale deliveries', () => {
  assert.throws(() => verifyClerkWebhook(payload, new Headers(), secret));
  assert.throws(() => verifyClerkWebhook(`${payload} `, signedHeaders(), secret));
  const wrongSecret = `whsec_${Buffer.from('another-test-signing-secret-value').toString('base64')}`;
  assert.throws(() => verifyClerkWebhook(payload, signedHeaders(), wrongSecret));
  assert.throws(() => verifyClerkWebhook(payload, signedHeaders(payload, new Date(Date.now() - 600_000)), secret));
});

test('webhook and fallback use a unique Clerk ID upsert without overwriting existing users', async () => {
  const calls: unknown[] = [];
  const db = { user: { upsert: async (args: unknown) => { calls.push(args); return { id: 'local_user' }; } } } as unknown as Pick<PrismaClient, 'user'>;
  const profile = {
    id: 'user_123', firstName: 'Sam', lastName: null, imageUrl: null,
    primaryEmailAddressId: 'email_primary',
    emailAddresses: [{ id: 'email_secondary', emailAddress: 'other@example.com' }, { id: 'email_primary', emailAddress: 'sam@example.com' }],
  };
  await createUserIfMissing(db, profile);
  assert.deepEqual(calls[0], {
    where: { clerkUserId: 'user_123' }, update: {},
    create: { clerkUserId: 'user_123', email: 'sam@example.com', firstName: 'Sam', lastName: null, imageUrl: null },
  });
});

test('supports Clerk accounts without an email address', async () => {
  let created: { email: string | null } | undefined;
  const db = { user: { upsert: async (args: { create: { email: string | null } }) => { created = args.create; return {}; } } } as unknown as Pick<PrismaClient, 'user'>;
  await createUserIfMissing(db, { id: 'user_phone', firstName: null, lastName: null, imageUrl: null, primaryEmailAddressId: null, emailAddresses: [] });
  assert.equal(created?.email, null);
});

test('a concurrent first-login creation returns the winning record', async () => {
  const record = { id: 'winning_record', clerkUserId: 'user_race' };
  const db = { user: {
    upsert: async () => { throw { code: 'P2002' }; },
    findUniqueOrThrow: async (args: unknown) => {
      assert.deepEqual(args, { where: { clerkUserId: 'user_race' } });
      return record;
    },
  } } as unknown as Pick<PrismaClient, 'user'>;
  assert.deepEqual(await createUserIfMissing(db, { id: 'user_race', firstName: null, lastName: null, imageUrl: null, primaryEmailAddressId: null, emailAddresses: [] }), record);
});

test('database failures propagate so webhook deliveries can be retried', async () => {
  const db = { user: { upsert: async () => { throw new Error('database unavailable'); } } } as unknown as Pick<PrismaClient, 'user'>;
  await assert.rejects(createUserIfMissing(db, { id: 'user_retry', firstName: null, lastName: null, imageUrl: null, primaryEmailAddressId: null, emailAddresses: [] }), /database unavailable/);
});

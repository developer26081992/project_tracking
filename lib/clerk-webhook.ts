import { Webhook } from 'svix';
import type { WebhookEvent } from '@clerk/nextjs/server';

export function verifyClerkWebhook(payload: string, headers: Headers, secret: string): WebhookEvent {
  new Webhook(secret).verify(payload, {
    'svix-id': headers.get('svix-id') ?? '',
    'svix-timestamp': headers.get('svix-timestamp') ?? '',
    'svix-signature': headers.get('svix-signature') ?? '',
  });
  // Svix v2 verifies the signature without parsing the body.
  return JSON.parse(payload) as WebhookEvent;
}

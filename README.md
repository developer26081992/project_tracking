# Project Management Dashboard - Parts (a), (b), (c) and (d)

- Live application: https://agency-projects-dashboard.vercel.app
- Public GitHub repository: https://github.com/developer26081992/agency-projects-dashboard
- Clerk webhook: `https://agency-projects-dashboard.vercel.app/api/webhooks/clerk`

Next.js 13 App Router, React, Tailwind, Prisma, Neon PostgreSQL and Clerk
authentication for a software agency dashboard. Includes project statistics,
project lists, Kanban task management and task creation.
The public `main` branch contains a sanitized source snapshot. Credential-bearing
earlier local history is excluded from the public repository. Real credentials
belong in ignored `.env` files and Vercel environment settings, never this file
or `.env.example`.

## AI agent disclosure

OpenAI Codex, an AI coding agent, was used to create the Prisma schema, migration,
seed script, authentication integration, dashboard UI, tests and setup documentation. Review and validate generated code before
submitting or using production data.

## Setup

1. Install Node.js 22 or newer and run `npm ci`.
2. Create a Neon PostgreSQL project and copy its pooled and direct connection URLs.
3. Copy `.env.example` to `.env`, replace both database URLs, and configure Clerk
   keys as described below. Prisma reads `.env`; Next.js also loads this file.
4. Run `npm run db:validate` and `npm run db:generate`.
5. Run `npm run db:deploy` to apply the committed migration to Neon.
6. Run `npm run db:seed` to insert the demonstration data.
7. Run `npm run db:status` to confirm migrations are applied. Use
   `npm run db:studio` to inspect the two projects and their tasks.
8. Run `npm run dev` and open `http://localhost:3000`. For a production build,
   run `npm run build` followed by `npm start`.

For future schema changes, run `npm run db:migrate -- --name describe_change`
against a development database, then commit the generated migration. Use
`db:deploy` for deployment; do not use `db push` as a substitute for migrations.
Prisma is pinned to 6.19.0, with its matching generated client.

## Required environment variables

| Variable | Purpose | Where required |
| --- | --- | --- |
| `DATABASE_URL` | Neon pooled PostgreSQL URL, including `sslmode=require` | Prisma Client and seed runtime |
| `DIRECT_URL` | Neon direct PostgreSQL URL (hostname without `-pooler`), including `sslmode=require` | Prisma migration commands and schema validation |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key from Clerk Dashboard | Browser and server |
| `CLERK_SECRET_KEY` | Secret API key from the same Clerk instance | Server only |
| `CLERK_WEB_HOOK_SECRET` | Endpoint signing secret (`whsec_...`) from Clerk Webhooks; assignment's required name | Webhook signature verification only |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Optional compatibility alias; used only if `CLERK_WEB_HOOK_SECRET` is empty | Webhook signature verification only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Clerk local sign-in routing |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Clerk local sign-up routing |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/dashboard` | Destination after sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `/dashboard` | Destination after sign-up |
| `SEED_OWNER_CLERK_ID` | Optional real Clerk user ID; defaults to `user_demo_owner` | Demo seed only |
| `SEED_MEMBER_CLERK_ID` | Optional real Clerk user ID; defaults to `user_demo_developer` | Demo seed only |

Keep `.env` and credentials private. On Vercel, set these variables for each
deployment environment before building. Only `NEXT_PUBLIC_` values are intended
for the browser. Supabase, Stripe and Vercel AI SDK are not used here.

## Clerk authentication setup

1. Create a Clerk application and enable your required sign-in methods. Copy the
   publishable and secret keys from the same instance into `.env`.
2. Apply all committed Prisma migrations with `npm run db:deploy`.
3. Make the application reachable over HTTPS (a deployed URL or a local tunnel).
4. In Clerk Dashboard > Webhooks, create an endpoint at
   `https://YOUR_HOST/api/webhooks/ckerk` and subscribe to **user.created**.
   The brief's `ckerk` spelling is supported exactly; `/api/webhooks/clerk` is
   also supported. Configure only one endpoint to avoid duplicate deliveries.
5. Copy that endpoint's signing secret into `CLERK_WEB_HOOK_SECRET` and
   restart/redeploy. For a production Clerk instance, configure its production
   domain and redirect URLs to match the deployment.

`/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` render Clerk's prebuilt
components. Successful authentication redirects to `/dashboard`. `middleware.ts`
protects every `/dashboard` path, including nested paths and names containing
file extensions. The dashboard layout and sync action independently check the
session before accessing user data. The public webhook routes bypass session
middleware and require a valid Svix signature over the original request body.

Clerk sends `user.created` when the Clerk account is created, rather than on every
login. The webhook creates a local `User` using its unique `clerkUserId`. On
dashboard entry, the `syncUser` Server Action in `app/api/user/sync/actions.ts`
creates the local record if it is absent. This also covers existing Clerk users
and delayed webhook delivery. The action derives identity from the verified
session and Clerk Backend API, never from caller-supplied IDs or profile data.
Both paths use idempotent upserts and handle concurrent creation.

`POST /api/user/sync` exposes the same action as an authenticated HTTP fallback.
It accepts no user input and returns only the local and Clerk IDs. Signed-out
requests receive 401. GET does not create records. Invalid webhook signatures
return 400; database failures return 500 so Clerk can retry. Unrelated verified
event types are acknowledged without changing data. Profile updates and account
deletions are outside this part's scope.

### Verify first-login persistence

1. Run `npm run typecheck`, `npm test`, and `npm run build`.
2. Visit `/dashboard` signed out; confirm you cannot access it. Repeat with a
   nested route such as `/dashboard/settings`.
3. Create a new account at `/sign-up`. Confirm it reaches the dashboard overview,
   then inspect `User` in Prisma Studio. Its
   `clerkUserId` must match Clerk Dashboard's user ID.
4. Inspect the webhook delivery in Clerk Dashboard and resend it. Confirm only
   one row exists for that `clerkUserId`.
5. Sign in with an account created before the webhook was configured. The
   dashboard fallback must create its local record. From the signed-in browser
   console, `fetch('/api/user/sync', { method: 'POST' })` should also succeed.
6. Send an unsigned POST to either webhook URL and confirm 400 with no insert.
   Send a signed-out POST to `/api/user/sync` and confirm 401.

Local sign-in and database persistence require actual Clerk and Neon credentials.
The deployed instance has its keys configured. Clerk's standard `user.created`
test delivery was verified end to end: HTTP 200 and a new Prisma `User` record.
The synthetic verification record was removed afterward. A person's interactive
sign-in still requires them to complete Clerk's sign-up/sign-in flow.

## Dashboard and task management

| Route | Behavior |
| --- | --- |
| `/dashboard` | Total/active projects, open/completed tasks, project progress, and eight most recently updated tasks |
| `/dashboard/projects` | Projects owned by the current user or containing their team membership |
| `/dashboard/projects/[id]` | Project details and TODO / IN_PROGRESS / DONE Kanban columns |
| `/dashboard/projects/[id]/tasks/new` | Task title, description, status, priority, optional assignee and due date |

The board uses `@hello-pangea/dnd`. Drag a card by its grip, use keyboard controls
(Space to lift/drop, arrow keys to move), or select a new status from its menu.
The card moves immediately, before the Server Action finishes. Controls lock
while saving; failures restore the previous status and show a retry message.
Only cross-column status changes persist; within-column ordering is not stored.
Moves and new tasks revalidate the project page, project list, and dashboard.
The project progress header receives the saved totals through revalidation.

All queries and Server Actions derive identity from Clerk on the server. Project
owners and team members may create and move tasks; other users cannot read or
mutate that project's tasks. Task status writes include project access in the
database update filter. An assignee must belong to the same project. Server-side
validation rejects invalid statuses/priorities, empty/oversized titles, oversized
descriptions, and invalid dates. Due dates are stored at UTC midnight and displayed
in UTC to preserve the chosen calendar day. Task timestamps are added by the
third migration; existing tasks receive the migration time as their baseline.

### Load accessible demonstration projects

After signing up, copy your user ID from Clerk Dashboard into
`SEED_OWNER_CLERK_ID` in `.env`, then run `npm run db:deploy` and `npm run db:seed`
against a **demo database**. Optionally set `SEED_MEMBER_CLERK_ID` to another real
Clerk user ID. Seeding with the placeholder IDs alone does not give your signed-in
account access to the demo projects. New users without project memberships see
an empty workspace. Project creation and team-invitation interfaces are outside
Part (c)'s scope.

The seed updates its fixed demo records and preserves unrelated data and existing
memberships. It can reset task statuses, change the demo owner, and reassign demo
tasks, so do not use it against production agency data or run it on every build.

### Verify Kanban persistence

1. Sign in as the seeded owner and open `/dashboard/projects`. Both demo projects
   should appear. Open one project and confirm all three status columns.
2. Move a task to another column. It should move immediately, then confirm the
   saved message. Reload and verify its status remains changed. The overview and
   project list should show the updated completed/open-task counts.
3. Use Create task, enter a title and optional fields, and submit. Confirm return
   to the board and that the task remains after reloading.
4. Temporarily take the network offline and move a card. The card should return
   to its prior column with an error. Restore the connection and retry.
5. Sign in as a project member and repeat. Sign in with an unrelated account and
   confirm the project is absent from its list and direct navigation returns 404.

## Data model

- `Project`: ID, name, description, status, Clerk owner ID, and `createdAt`
  (the conventional spelling of the brief's `createAt`).
- `Task`: ID, title, description, TODO/IN_PROGRESS/DONE status,
  LOW/MEDIUM/HIGH priority, project, optional assignee/due date, and timestamps.
- `TeamMember`: composite key `(userId, projectId)` and OWNER/MANAGER/MEMBER role.
  User IDs are external Clerk IDs.
- `User`: local ID, unique `clerkUserId`, optional primary email/profile fields,
  and timestamps. Clerk remains the authentication provider; no passwords are
  stored locally. Project owner/member IDs remain Clerk IDs, so Part (a)'s demo
  IDs are not constrained to real local accounts.

An assigned task must reference a member of the same project. Clear or reassign
their tasks before removing a member. Project deletion cascades to its tasks and
memberships. Application code must enforce Clerk authentication, project access,
owner membership, and role permissions; the database alone does not authenticate users.

The seed inserts two projects, five tasks per project across all three statuses
and priorities, and two members per project. Fixed IDs and transactional upserts
make it repeatable without deleting unrelated data. Rerunning it resets demo
records to their seed values. `user_demo_owner` and `user_demo_developer` are
placeholder Clerk IDs; replace these with real Clerk user IDs for authenticated demos.

## Submission and deployment status

All three committed migrations have been applied to Neon. The Clerk webhook
subscribes to `user.created` at the URL above. Clerk and Neon variables are stored
as encrypted Vercel environment variables for production, preview and development.
The supplied Clerk instance uses development/test keys, suitable for assessment
demonstrations. Use a production Clerk instance and production keys for a real
agency launch.

Production was deployed using the authenticated Vercel CLI. Automatic GitHub
deployment is not linked because the Vercel Git integration does not currently
have access to this repository. Until that integration is granted access, publish
updates using `npx vercel --prod` from the linked project after pushing `main`.
The public repository and production application are independently available.

### Reproduce the Vercel deployment

1. Clone the public repository and use its `main` branch. Configure `.env` locally
   using `.env.example`; do not commit `.env` or credentials.
2. Import the repository into Vercel using the Next.js framework preset.
   `vercel.json` specifies `npm ci` and `npm run build`.
3. Add `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY`, `CLERK_WEB_HOOK_SECRET` and all four Clerk route/redirect
   variables from the table above. Set them before the build.
4. Run `npm run db:deploy` against the intended Neon database, then deploy the
   production branch. `npm run build` generates Prisma Client automatically.
   Do not seed on every deployment.
5. Register the deployed `/api/webhooks/clerk` endpoint in Clerk and subscribe to
   `user.created`. Save its signing secret to `CLERK_WEB_HOOK_SECRET` in Vercel,
   then redeploy. The handler also supports the brief's `/api/webhooks/ckerk` path.
6. Confirm the production URL loads while signed out, sign-up/sign-in work,
   `/dashboard` is protected, and Clerk webhook deliveries return 200. Ensure
   Vercel deployment protection does not block the public production URL or webhook.

Keep the production deployment active and the GitHub repository public through
marking. Changing a Vercel environment variable requires a redeploy to take effect.

## Validation performed

- Prisma schema validation passed.
- Prisma Client generation passed.
- Production build and TypeScript checks passed; all 15 authentication/task tests pass.
- Initial SQL migration generated with Prisma Migrate's schema diff command.
- Seed JavaScript syntax check passed.
- All three migrations were applied successfully to Neon; schema status is current.
- The Neon seed completed: two projects, ten tasks and their memberships.
- Real Neon task-service checks passed for creation, persisted status changes,
  denied outsider writes and preserving the selected due date. The temporary
  verification task was removed afterward.
- Production checks on 2026-11-02: home/sign-in/sign-up return 200 without Vercel
  authentication; signed-out dashboard navigation redirects to Clerk; sync
  returns 401 signed out; unsigned webhook requests return 400. The browser
  renders Clerk's actual sign-up form.
- Clerk's registered `user.created` test delivery returned HTTP 200 and created
  its local `User` record in Neon. The synthetic record was removed after checking.
- The GitHub repository is public, with `main` as its default branch; only the
  sanitized branch was pushed. Both deliverable URLs are recorded at the top.
- Authentication tests cover valid and invalid signatures, stale deliveries,
  primary-email mapping, accounts without email, concurrent user creation and
  database error propagation.
- Task tests cover scoped writes, denied project access, same-project assignees,
  signed-out requests, runtime enum/text validation, and calendar-date validation.
- Browser tests of the real UI components in an isolated fixture passed for mouse
  and keyboard dragging, immediate optimistic moves, disabled controls while
  saving, failed-save rollback, sequential moves, and task-form success/failure.
  This fixture uses test data and simulated mutations; it is not a production
  authentication bypass and does not verify a real Neon connection.
- Independent visual checks passed at desktop, tablet and 375px mobile widths.
  Screenshots in `artifacts/dashboard/` show the isolated component fixture.
  Final desktop overview and Kanban WCAG 2 A/AA browser audits reported zero
  violations after contrast and avatar-label fixes.
- Local HTTP checks with test-only configuration verified sign-in/sign-up pages
  return 200, signed-out dashboard document navigation redirects, nested and
  file-extension dashboard requests are blocked, sync returns 401 signed out,
  and both unsigned webhook endpoints return 400.
- `npm audit` reports six affected packages (five high, one critical), including
  the Prisma CLI chain and Next.js 13 with its bundled PostCSS. Next.js 13 is
  retained to match the assignment, and Server Actions are experimental in this
  version. Upgrade to a supported, patched Next.js release before production
  use. The current Clerk 6 package supports this version but warns about future
  removal. Automatic audit fixes require major-version upgrades.

## Reference

[Prisma 6 configuration](https://www.prisma.io/docs/orm/v6/reference/prisma-config-reference)
documents the schema-based pooled `url` and migration `directUrl` configuration.

[Clerk middleware](https://clerk.com/docs/reference/nextjs/clerk-middleware) and
[Clerk webhook synchronization](https://clerk.com/docs/guides/development/webhooks/syncing)
describe the authentication and event-verification patterns used here.

[`@hello-pangea/dnd` responders](https://github.com/hello-pangea/dnd/blob/main/docs/guides/responders.md)
documents the drag callbacks used for optimistic status changes.

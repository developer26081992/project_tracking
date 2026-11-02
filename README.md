# Project Management Dashboard

A dashboard for software agency teams to track client projects, tasks and team members. Features include project statistics, recent activity, project lists, a Kanban board with optimistic drag-and-drop updates, and task creation.

- **Live application:** https://agency-projects-dashboard.vercel.app
- **Public repository:** https://github.com/developer26081992/project_tracking

## Technology stack

| Technology | Purpose |
| --- | --- |
| Next.js 13 App Router and React 18 | Application pages, route handlers and Server Actions |
| TypeScript | Application types and validation support |
| Tailwind CSS | Responsive styling |
| Neon PostgreSQL | Hosted relational database |
| Prisma 6 | Database client, schema, migrations and seeding |
| Clerk | Authentication, prebuilt sign-in/sign-up components and user webhooks |
| `@hello-pangea/dnd` | Mouse and keyboard drag-and-drop |
| Svix | Clerk webhook signature verification |
| Vercel | Application hosting and environment configuration |
| npm and GitHub | Package management and source control |

## Local setup

1. Install Node.js 22 or newer, npm and Git.
2. Clone the repository and install dependencies:
   ```powershell
   git clone https://github.com/developer26081992/project_tracking.git
   cd project_tracking
   npm ci
   ```
3. Create a Neon PostgreSQL database and a Clerk application.
4. Copy the safe environment template:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Fill in the database URLs and Clerk keys in `.env` using the table below. Never commit real secrets. Prisma and Next.js load `.env` locally.
6. Generate the database client and apply the committed migrations:
   ```powershell
   npm run db:validate
   npm run db:generate
   npm run db:deploy
   ```
7. Start the application:
   ```powershell
   npm run dev
   ```
   Open http://localhost:3000 and create an account.
8. To access the demonstration projects, copy your user ID from Clerk Dashboard > Users into `SEED_OWNER_CLERK_ID` in `.env`, then run:
   ```powershell
   npm run db:seed
   ```
   Refresh the dashboard. The seed creates two projects with five tasks each. Running it again resets the demo records, so use it only against a demonstration database.

For a local production build, run `npm run build`, then `npm start`. Use `npm run db:studio` to inspect records and `npm run db:status` to check migrations. For future schema changes, use `npm run db:migrate -- --name describe_change` against a development database and commit the generated migration.

## Environment variables

Use [`.env.example`](.env.example) as the template. Store real values in ignored `.env` files locally and in Vercel's environment settings when deployed.

| Variable | Required | Purpose or value |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon pooled PostgreSQL connection URL with `sslmode=require` |
| `DIRECT_URL` | Yes | Neon direct connection URL, without `-pooler` in the hostname, for migrations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Publishable key from Clerk Dashboard |
| `CLERK_SECRET_KEY` | Yes | Server-only secret API key from the same Clerk instance |
| `CLERK_WEB_HOOK_SECRET` | Yes, for webhooks | Endpoint signing secret from Clerk Webhooks, beginning with `whsec_` |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Optional alias | Fallback only when `CLERK_WEB_HOOK_SECRET` is empty; both are not needed |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Set as shown | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Set as shown | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | Set as shown | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | Set as shown | `/dashboard` |
| `SEED_OWNER_CLERK_ID` | Optional, for seeding | Real Clerk ID of the demo project owner; defaults to `user_demo_owner` |
| `SEED_MEMBER_CLERK_ID` | Optional, for seeding | Real Clerk ID of a demo team member; defaults to `user_demo_developer` |

Only `NEXT_PUBLIC_` values are intended for the browser. Keep database passwords, Clerk secret keys and webhook signing secrets private. Placeholder seed IDs do not give a newly registered account access to the demonstration projects.

## Clerk webhook configuration

1. In Clerk Dashboard > Webhooks, create an endpoint for your deployed application:
   ```text
   https://agency-projects-dashboard.vercel.app/api/webhooks/clerk
   ```
   For another deployment, replace the hostname. Local testing requires a public HTTPS tunnel to the local server.
2. Subscribe to **`user.created`**.
3. Copy the endpoint signing secret into `CLERK_WEB_HOOK_SECRET` locally and in Vercel.
4. Restart the local server or redeploy on Vercel after changing environment variables.
5. Send Clerk's `user.created` test event and confirm HTTP 200. Inspect the `User` table in Prisma Studio to confirm persistence. Remove any synthetic test records afterward.

The application verifies the original request body with Svix before using event data. The alternate `/api/webhooks/ckerk` route is supported, but configure only one endpoint to avoid duplicate deliveries.

Each local `User` has a unique `clerkUserId`. Dashboard entry also runs an authenticated sync action to create a missing record if webhook delivery is delayed. `POST /api/user/sync` provides the same authenticated fallback. Identity comes from Clerk, not caller-supplied user IDs.

## Application routes and access

| Route | Purpose |
| --- | --- |
| `/sign-in` and `/sign-up` | Clerk authentication pages |
| `/dashboard` | Project statistics and recently updated tasks |
| `/dashboard/projects` | Projects owned by the current user or containing their membership |
| `/dashboard/projects/[id]` | Project details and TODO / IN_PROGRESS / DONE Kanban board |
| `/dashboard/projects/[id]/tasks/new` | Create a task with priority, optional assignee and due date |

Middleware protects dashboard routes. Server-side queries and mutations independently check authentication and project access. Owners and members can create and move tasks; unrelated users cannot access the project. Assignees must belong to the same project.

Drag a task by its grip, use Space and arrow keys, or choose its status menu. The card moves immediately while the Server Action saves. Failed saves roll back the move and display an error. Successful changes revalidate the project page, project list and overview. Within-column ordering is not persisted.

The database contains `User`, `Project`, `Task` and `TeamMember` models. Membership uses a composite `(userId, projectId)` key. Project deletion cascades to its tasks and memberships. Due dates are stored and displayed in UTC to preserve the selected calendar day. Project creation and team-invitation screens are not included; project ownership and memberships are configured through the seed or database administration.

## Deployment

The live application is hosted on Vercel with Neon and Clerk configured. The current Clerk instance uses development/test keys. Use a production Clerk instance and production keys for a real agency launch.

To deploy another instance:

1. Import the GitHub repository into Vercel using the Next.js preset, or link it using the Vercel CLI.
2. Set the required environment variables before building.
3. Run `npm run db:deploy` against the target Neon database.
4. Deploy using `npx vercel --prod`. `vercel.json` specifies `npm ci` and `npm run build`; the build generates Prisma Client.
5. Register the deployment's Clerk webhook and redeploy after setting its signing secret.
6. Confirm the production URL and webhook are publicly reachable, while dashboard routes still require Clerk authentication.

The current deployment uses Vercel CLI publishing. Automatic deployment from GitHub requires granting the Vercel integration access to the repository. Do not seed automatically during builds.

`next.config.js` disables inner-graph optimization and module concatenation for server bundles to preserve Clerk parent constructors with Next.js 13. Keep this compatibility fix when rebuilding this version.

## Verification and known limitations

Run:

```powershell
npm run typecheck
npm test
npm run build
```

The 15 tests cover webhook signatures, user synchronization helpers, task validation and project-scoped writes. Production verification also covered signed-in dashboard rendering, user sync, webhook delivery and Neon persistence. Temporary verification accounts and records were removed.

Check the complete workflow before use: sign in, open a project, move a task, refresh to confirm persistence, create a task, and verify signed-out dashboard protection. Newly registered accounts need ownership or membership before projects appear.

Known dependency advisories affect Next.js 13, its bundled PostCSS and the Prisma CLI dependency chain. Server Actions are experimental in this Next.js version. Review `npm audit` and plan a supported-version upgrade before production business use.

## Flash drive contents

Copy the project into a `project_tracking` folder on the flash drive with the following contents:

| Contents | Description |
| --- | --- |
| `README.md` | Project overview, setup instructions, configuration and live/repository URLs |
| `.env.example` | Credential-free configuration template |
| `app/` | Pages, layouts, components, Server Actions and API routes |
| `lib/` | Prisma client, authentication helpers, types and task/project logic |
| `prisma/schema.prisma` | Database models and relationships |
| `prisma/migrations/` | Committed migration SQL and migration lock file |
| `prisma/seed.js` | Repeatable demonstration data script |
| `tests/` and `types/` | Automated tests and supporting type declarations |
| `package.json` and `package-lock.json` | Dependencies, scripts and reproducible installation |
| `middleware.ts` | Dashboard route protection |
| `next.config.js` and `next-env.d.ts` | Next.js configuration and type declarations |
| `tsconfig.json`, `tailwind.config.js`, `postcss.config.js` | TypeScript and styling configuration |
| `vercel.json`, `.vercelignore`, `.gitignore` | Deployment and exclusion rules |

The `artifacts/dashboard/` screenshots are optional supporting material and are not required to run the application. The hosted Neon database is provisioned using migrations and the seed script; no database credentials or database dump are required in the handover.

Exclude `.env`, `.env.local`, other private environment files, `.git/`, `.vercel/`, `node_modules/`, `.next/`, logs and temporary files. Install dependencies with `npm ci` after copying the source. This list describes how to prepare the flash drive; it does not mean a physical drive has already been populated.

## AI agent disclosure

OpenAI Codex AI agents assisted with the database schema, migrations, seed script, authentication, dashboard UI, tests, deployment configuration and documentation.

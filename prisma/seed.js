const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const ownerId = process.env.SEED_OWNER_CLERK_ID || 'user_demo_owner';
  const developerId = process.env.SEED_MEMBER_CLERK_ID || 'user_demo_developer';
  // Fixed IDs and upserts make repeated runs safe without deleting agency data.
  await prisma.$transaction(async (tx) => {
    const projects = [
      { id: 'seed-client-portal', name: 'Client Portal', description: 'Build a self-service portal for agency clients.', status: 'IN_PROGRESS' },
      { id: 'seed-agency-website', name: 'Agency Website', description: 'Redesign the agency marketing website.', status: 'PLANNED' },
    ];
    for (const project of projects) {
      const data = { ...project, ownerId };
      await tx.project.upsert({ where: { id: project.id }, update: data, create: data });
      const members = new Map([[developerId, 'MEMBER'], [ownerId, 'OWNER']]);
      for (const [userId, role] of members) {
        await tx.teamMember.upsert({
          where: { userId_projectId: { userId, projectId: project.id } },
          update: { role }, create: { userId, projectId: project.id, role },
        });
      }
      const tasks = [
        ['requirements', 'Gather client requirements', 'DONE', 'HIGH'],
        ['design', 'Design interface', 'IN_PROGRESS', 'HIGH'],
        ['implementation', 'Implement core pages', 'TODO', 'MEDIUM'],
        ['testing', 'Test client workflows', 'TODO', 'HIGH'],
        ['documentation', 'Write handover documentation', 'TODO', 'LOW'],
      ];
      for (const [index, [key, title, status, priority]] of tasks.entries()) {
        const id = `${project.id}-${key}`;
        const data = {
          title, description: `${title} for ${project.name}.`, status, priority,
          projectId: project.id, assignedId: developerId,
          dueDate: new Date(Date.UTC(2026, 10, 9 + index)),
        };
        await tx.task.upsert({ where: { id }, update: data, create: { id, ...data } });
      }
    }
  }, { maxWait: 15000, timeout: 60000 });
  console.log('Seeded 2 projects, 10 tasks, and their project memberships.');
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });

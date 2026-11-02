import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { changeTaskStatus, insertTask, validateTaskInput } from '../lib/task-service';
import { projectScope } from '../lib/project-access';

const input = { title: '  Ship portal  ', description: ' Release to client ', status: 'TODO', priority: 'HIGH', assignedId: '', dueDate: '' };
type DB = Pick<PrismaClient, 'task' | '$transaction'>;

test('task validation trims text and supports optional assignment and date', () => {
  assert.deepEqual(validateTaskInput(input), { ok: true, data: { title: 'Ship portal', description: 'Release to client', status: 'TODO', priority: 'HIGH', assignedId: null, dueDate: null } });
  const result = validateTaskInput({ ...input, dueDate: '2028-02-29' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.dueDate?.toISOString(), '2028-02-29T00:00:00.000Z');
});

test('rejects empty titles, oversized text, forged enums, assignees and impossible dates', () => {
  for (const invalid of [
    null, {}, { ...input, title: '  ' }, { ...input, title: 'x'.repeat(201) },
    { ...input, description: 'x'.repeat(5001) }, { ...input, status: 'DELETED' },
    { ...input, priority: 'URGENT' }, { ...input, assignedId: '../user_other' },
    { ...input, dueDate: '2027-02-29' }, { ...input, dueDate: '2026-13-01' },
    { ...input, dueDate: '2026-01-01T12:00:00Z' }, { ...input, dueDate: '0000-01-01' },
  ]) assert.equal(validateTaskInput(invalid).ok, false);
});

test('status writes scope task ID, project ID, and owner-or-member permission atomically', async () => {
  let query: unknown;
  const db = { task: { updateMany: async (args: unknown) => { query = args; return { count: 1 }; } } } as unknown as DB;
  assert.deepEqual(await changeTaskStatus(db, 'user_member', 'project_a', 'task_a', 'DONE'), { ok: true });
  assert.deepEqual(query, {
    where: { id: 'task_a', projectId: 'project_a', project: { OR: [{ ownerId: 'user_member' }, { teamMembers: { some: { userId: 'user_member' } } }] } },
    data: { status: 'DONE' },
  });
});

test('unavailable and unauthorized tasks cannot be changed', async () => {
  const db = { task: { updateMany: async () => ({ count: 0 }) } } as unknown as DB;
  assert.equal((await changeTaskStatus(db, 'user_outsider', 'project_other', 'task_a', 'DONE')).ok, false);
});

test('invalid or signed-out status writes never reach the database', async () => {
  const db = {} as DB;
  for (const [user, project, task, status] of [
    ['', 'project_a', 'task_a', 'DONE'], ['user_a', '../project', 'task_a', 'TODO'],
    ['user_a', 'project_a', 'task_a', 'UNKNOWN'], ['user_a', 'project_a', '', 'DONE'],
  ]) assert.equal((await changeTaskStatus(db, user, project, task, status)).ok, false);
});

function createDb({ projectExists = true, memberExists = true } = {}) {
  const calls: { project?: unknown; member?: unknown; create?: unknown } = {};
  const tx = {
    project: { findFirst: async (args: unknown) => { calls.project = args; return projectExists ? { id: 'project_a' } : null; } },
    teamMember: { findUnique: async (args: unknown) => { calls.member = args; return memberExists ? { userId: 'user_assignee' } : null; } },
    task: { create: async (args: unknown) => { calls.create = args; return { id: 'task_new' }; } },
  };
  return { calls, db: { $transaction: async (callback: (client: typeof tx) => unknown) => callback(tx) } as unknown as DB };
}

test('task creation rejects an inaccessible project before writing', async () => {
  const { db, calls } = createDb({ projectExists: false });
  assert.equal((await insertTask(db, 'user_outsider', 'project_a', input)).ok, false);
  assert.equal(calls.create, undefined);
  assert.deepEqual(calls.project, { where: { id: 'project_a', ...projectScope('user_outsider') }, select: { id: true } });
});

test('task creation prevents assignments to a member from another project', async () => {
  const { db, calls } = createDb({ memberExists: false });
  assert.equal((await insertTask(db, 'user_owner', 'project_a', { ...input, assignedId: 'user_other_project' })).ok, false);
  assert.equal(calls.create, undefined);
  assert.deepEqual(calls.member, { where: { userId_projectId: { userId: 'user_other_project', projectId: 'project_a' } }, select: { userId: true } });
});

test('creating a valid task rechecks project access and connects an assignee in the same project', async () => {
  const { db, calls } = createDb();
  assert.deepEqual(await insertTask(db, 'user_owner', 'project_a', { ...input, assignedId: 'user_assignee' }), { ok: true, taskId: 'task_new' });
  assert.deepEqual(calls.create, {
    data: { title: 'Ship portal', description: 'Release to client', status: 'TODO', priority: 'HIGH', dueDate: null,
      project: { connect: { id: 'project_a', ...projectScope('user_owner') } },
      assignee: { connect: { userId_projectId: { userId: 'user_assignee', projectId: 'project_a' } } },
    }, select: { id: true },
  });
});

test('signed-out or malformed create requests never open a transaction', async () => {
  assert.equal((await insertTask({} as DB, '', 'project_a', input)).ok, false);
  assert.equal((await insertTask({} as DB, 'user_a', 'project_a', { ...input, status: 'FORGED' })).ok, false);
});

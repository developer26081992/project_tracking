'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { createTask } from '../actions';
import { TASK_PRIORITIES, TASK_STATUSES, type ProjectDetail } from '../../../lib/dashboard-types';
import { Icon, statusLabels } from './ui';

export function TaskForm({ projectId, members }: { projectId: string; members: ProjectDetail['members'] }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '');
    submitting.current = true;
    setPending(true);
    setError('');
    let created = false;
    try {
      const result = await createTask(projectId, { title: value('title'), description: value('description'), status: value('status'), priority: value('priority'), assignedId: value('assignedId'), dueDate: value('dueDate') });
      if (!result.ok) { setError(result.error); return; }
      created = true;
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch {
      setError('We couldn’t create your task. Check your connection and try again.');
    } finally { if (!created) { submitting.current = false; setPending(false); } }
  }
  return <form onSubmit={submit} className="rounded-lg border border-[#dce3d2] bg-white" aria-busy={pending}>
    <fieldset disabled={pending} className="space-y-6 p-6 sm:p-8"><legend className="sr-only">Task details</legend><div><label htmlFor="task-title" className="mb-2 block text-xs font-semibold">Task title <span className="text-emerald-800">*</span></label><input id="task-title" className="workspace-field" name="title" placeholder="What needs to get done?" required maxLength={200} autoFocus /><p className="mt-2 text-[11px] text-[#6e7964]">Keep it clear and specific. Up to 200 characters.</p></div>
      <div><label htmlFor="task-description" className="mb-2 block text-xs font-semibold">Description <span className="font-normal text-[#6e7964]">(optional)</span></label><textarea id="task-description" className="workspace-field min-h-32 resize-y" name="description" placeholder="A little context, a definition of done, or a useful link…" maxLength={5000} rows={5} /></div>
      <div className="grid gap-6 sm:grid-cols-2"><div><label htmlFor="task-status" className="mb-2 block text-xs font-semibold">Status</label><select id="task-status" className="workspace-field" name="status" defaultValue="TODO">{TASK_STATUSES.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></div><div><label htmlFor="task-priority" className="mb-2 block text-xs font-semibold">Priority</label><select id="task-priority" className="workspace-field" name="priority" defaultValue="MEDIUM">{TASK_PRIORITIES.map((priority) => <option value={priority} key={priority}>{priority[0] + priority.slice(1).toLowerCase()}</option>)}</select></div></div>
      <div className="grid gap-6 sm:grid-cols-2"><div><label htmlFor="task-assignee" className="mb-2 block text-xs font-semibold">Assign to <span className="font-normal text-[#6e7964]">(optional)</span></label><select id="task-assignee" className="workspace-field" name="assignedId" defaultValue=""><option value="">Unassigned</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></div><div><label htmlFor="task-due" className="mb-2 block text-xs font-semibold">Due date <span className="font-normal text-[#6e7964]">(optional)</span></label><input id="task-due" className="workspace-field" type="date" name="dueDate" min="1900-01-01" max="9999-12-31" /></div></div>
    </fieldset>
    <div className="border-t border-[#e5eadf] px-6 py-5 sm:px-8"><div aria-live="polite" aria-atomic="true">{error && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}</div><div className="flex flex-wrap items-center justify-between gap-4"><p className="text-[11px] text-[#6e7964]">Small steps make great projects.</p><div className="flex items-center gap-3"><Link href={`/dashboard/projects/${projectId}`} className="workspace-button-secondary" aria-disabled={pending} onClick={(event) => { if (pending) event.preventDefault(); }}>Cancel</Link><button type="submit" className="workspace-button" disabled={pending}><Icon name="plus" className="h-4 w-4" />{pending ? 'Creating task…' : 'Create task'}</button></div></div></div>
  </form>;
}

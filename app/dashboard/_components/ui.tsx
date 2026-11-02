import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ProjectSummary, TaskPriorityValue, TaskStatusValue } from '../../../lib/dashboard-types';

export const statusLabels: Record<TaskStatusValue, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
export const projectStatusLabels: Record<string, string> = { PLANNED: 'Planned', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', ON_HOLD: 'On hold' };
export function Icon({ name, className = '' }: { name: 'grid' | 'projects' | 'arrow' | 'plus' | 'check' | 'clock' | 'people' | 'grip'; className?: string }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    projects: <path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2" /></>,
    grip: <path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" strokeWidth="3" />,
  };
  return <svg className={`h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function PriorityBadge({ priority }: { priority: TaskPriorityValue }) {
  const colors = { HIGH: 'text-rose-800 bg-rose-50', MEDIUM: 'text-amber-900 bg-amber-50', LOW: 'text-slate-600 bg-slate-100' };
  return <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold ${colors[priority]}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{priority[0] + priority.slice(1).toLowerCase()}</span>;
}
export function StatusBadge({ status }: { status: TaskStatusValue }) {
  return <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${status === 'DONE' ? 'text-emerald-800' : status === 'IN_PROGRESS' ? 'text-amber-900' : 'text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'DONE' ? 'bg-emerald-600' : status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-400'}`} />{statusLabels[status]}</span>;
}
export function formatDate(date: string | null) {
  if (!date) return 'No due date';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}
export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-9 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-[11px] font-semibold uppercase tracking-[.18em] text-emerald-800">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-tight text-[#202923] sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-[#626b63]">{description}</p>}</div>{action}</div>;
}
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-[#cdd4ca] bg-white/60 px-6 py-14 text-center"><div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#ecf0e8] text-emerald-800"><Icon name="projects" /></div><h2 className="text-lg font-semibold">{title}</h2><div className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#626b63]">{children}</div>{action && <div className="mt-5">{action}</div>}</div>;
}
export function ProjectRow({ project }: { project: ProjectSummary }) {
  const progress = project.taskCount ? Math.round(project.completedTaskCount / project.taskCount * 100) : 0;
  return <Link href={`/dashboard/projects/${project.id}`} className="group block border-b border-[#e7e9e1] px-5 py-6 last:border-0 hover:bg-[#fafbf7] sm:px-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-3"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#687367]">{projectStatusLabels[project.status] ?? project.status}</span><span className="h-1 w-1 rounded-full bg-[#c2c9be]" /><span className="text-xs text-[#687367]">{project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}</span></div><h3 className="break-words text-lg font-semibold tracking-tight group-hover:text-emerald-800">{project.name}</h3><p className="mt-1 line-clamp-2 max-w-xl text-sm leading-6 text-[#687367]">{project.description || 'No description yet.'}</p></div><Icon name="arrow" className="mt-6 text-[#85907f] transition-transform group-hover:translate-x-1 group-hover:text-emerald-800" /></div><div className="mt-5 flex items-center gap-4"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf0e9]" role="progressbar" aria-label={`${project.name} task completion`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} /></div><span className="shrink-0 text-xs tabular-nums text-[#626b63]">{project.completedTaskCount}/{project.taskCount} tasks</span></div></Link>;
}

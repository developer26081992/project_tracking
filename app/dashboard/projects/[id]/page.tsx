import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '../../../../lib/projects';
import { Icon, PageHeading, projectStatusLabels } from '../../_components/ui';
import { ProjectBoard } from '../../_components/project-board';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  const progress = project.taskCount ? Math.round(project.completedTaskCount / project.taskCount * 100) : 0;
  return <><Link className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#687364] hover:text-emerald-800" href="/dashboard/projects"><span aria-hidden="true">←</span> All projects</Link><PageHeading eyebrow={`Project / ${projectStatusLabels[project.status] ?? project.status}`} title={project.name} description={project.description} action={<Link className="workspace-button" href={`/dashboard/projects/${project.id}/tasks/new`}><Icon name="plus" className="h-4 w-4" /> Create task</Link>} />
    <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-y border-[#dde3d5] py-5"><div className="flex flex-wrap items-center gap-5 text-xs text-[#5d6d54]"><span className="inline-flex items-center gap-2"><Icon name="people" className="h-4 w-4" />{project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}</span><span className="inline-flex items-center gap-2"><Icon name="check" className="h-4 w-4" />{project.completedTaskCount} of {project.taskCount} tasks complete</span></div><div className="flex min-w-40 items-center gap-3"><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#dfe6d6]" role="progressbar" aria-label="Project completion" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-emerald-700" style={{ width: `${progress}%` }} /></div><span className="text-xs font-semibold tabular-nums text-emerald-800">{progress}%</span></div></div>
    <ProjectBoard projectId={project.id} tasks={project.tasks} />
  </>;
}

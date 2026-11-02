import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '../../../../../../lib/projects';
import { PageHeading } from '../../../../_components/ui';
import { TaskForm } from '../../../../_components/task-form';

export default async function NewTaskPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();
  return <div className="max-w-3xl"><Link href={`/dashboard/projects/${project.id}`} className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-[#687364] hover:text-emerald-800"><span aria-hidden="true">←</span> Back to board</Link><PageHeading eyebrow="Project / New task" title="Make the next step clear." description={`Add a task to ${project.name}. Give your team the details they need to keep things moving.`} /><TaskForm projectId={project.id} members={project.members} /></div>;
}

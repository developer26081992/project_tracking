import { getProjects } from '../../../lib/projects';
import { EmptyState, PageHeading, ProjectRow } from '../_components/ui';

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <><PageHeading eyebrow="Workspace / Projects" title="Projects with purpose." description="All the projects you own or contribute to, with a little perspective on how they’re progressing." />
    <div className="mb-5 flex items-center justify-between border-b border-[#dde3d5] pb-4"><h2 className="text-sm font-semibold">All projects <span className="ml-2 rounded bg-[#e8eddf] px-2 py-1 text-xs tabular-nums text-[#4a5c41]">{projects.length}</span></h2><span className="text-xs text-[#687364]">Newest projects first</span></div>
    {projects.length ? <div className="max-w-5xl overflow-hidden rounded-lg border border-[#dfe5d6] bg-white">{projects.map((project) => <ProjectRow key={project.id} project={project} />)}</div> : <EmptyState title="You’re ready for your first project.">When you own a project or join its team, it will appear here. Ask a project owner to invite you.</EmptyState>}
  </>;
}

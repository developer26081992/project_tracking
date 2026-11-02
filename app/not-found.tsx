import Link from 'next/link';
import { EmptyState } from './dashboard/_components/ui';

export default function DashboardNotFound() {
  return <EmptyState title="This project isn’t available.">It may have been removed, or you may need an invitation from its owner.<div className="mt-6"><Link className="workspace-button" href="/dashboard/projects">Back to projects</Link></div></EmptyState>;
}

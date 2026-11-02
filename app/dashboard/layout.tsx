import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { syncUser } from '../api/user/sync/actions';
import { DashboardNavigation } from './_components/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Check again at the data boundary; middleware is not the only guard.
  await auth.protect();
  const user = await syncUser();
  return (
    <div className="min-h-screen bg-[#f7f8f2] text-[#263027] lg:pl-60">
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
      <aside className="border-b border-[#dfe4d8] bg-[#f0f2e9] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <Link href="/dashboard" className="flex items-center gap-3 px-6 py-6 lg:px-7 lg:py-9"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#284f3b] text-lg font-semibold text-[#f1f5eb]">a<span className="text-[#b6d2a7]">.</span></span><div><span className="block text-sm font-bold tracking-tight">Agency Projects</span><span className="text-[10px] uppercase tracking-[.17em] text-[#606b5c]">Team workspace</span></div></Link>
        <div className="px-3 pb-3 lg:mt-5 lg:px-4"><p className="mb-3 hidden px-4 text-[10px] font-semibold uppercase tracking-[.18em] text-[#606b5c] lg:block">Workspace</p><DashboardNavigation /></div>
        <div className="mt-auto hidden border-t border-[#dfe4d8] p-6 text-xs leading-5 text-[#65705f] lg:block"><span className="mb-2 block font-semibold text-[#344c39]">A little clarity. A lot of progress.</span>One place for your projects,<br />people, and next steps.</div>
      </aside>
      <header className="flex h-20 items-center justify-between border-b border-[#e1e6db] px-5 sm:px-9"><p className="text-xs text-[#687364]">Your agency. <span className="text-[#364832]">In sync.</span></p><div className="flex items-center gap-3"><span className="hidden max-w-48 truncate text-xs font-medium text-[#53604e] sm:block">{user.firstName || user.email || 'Your account'}</span><UserButton afterSignOutUrl="/" /></div>
      </header>
      <main id="workspace-content" className="mx-auto max-w-[1500px] px-5 py-9 sm:px-9 sm:py-11 lg:px-11">{children}</main>
    </div>
  );
}

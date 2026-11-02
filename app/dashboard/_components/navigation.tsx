'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';
export function DashboardNavigation() {
  const pathname = usePathname();
  const links = [{ href: '/dashboard', label: 'Overview', icon: 'grid' as const }, { href: '/dashboard/projects', label: 'Projects', icon: 'projects' as const }];
  return <nav aria-label="Workspace navigation" className="flex gap-2 lg:flex-col">{links.map((link) => {
    const active = link.href === '/dashboard' ? pathname === link.href : pathname.startsWith(link.href);
    return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-[#e7eddf] text-[#234d39]' : 'text-[#636c62] hover:bg-[#edf0e7] hover:text-[#23352b]'}`}><Icon name={link.icon} /><span>{link.label}</span>{active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-emerald-800 lg:block" />}</Link>;
  })}</nav>;
}

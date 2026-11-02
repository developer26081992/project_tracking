'use client';

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section className="rounded-lg border border-[#dce3d2] bg-[#f7f8f2] p-8 text-[#263027]"><p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-800">Let’s try that again</p><h1 className="text-2xl font-semibold tracking-tight">We couldn’t load your workspace.</h1><p className="mt-3 text-sm leading-6 text-[#65725a]">Your account may still be syncing, or the connection may have been interrupted. Please try again.</p><button className="workspace-button mt-6" onClick={reset}>Try again</button></section>;
}

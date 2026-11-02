import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-700">Agency Projects</p>
      <h1 className="mt-5 text-4xl font-bold tracking-tight">Your team’s work, together.</h1>
      <p className="mt-4 text-lg text-slate-600">Sign in to access your project workspace.</p>
      <div className="mt-8 flex gap-4">
        <Link className="rounded-lg bg-indigo-700 px-5 py-3 font-medium text-white" href="/sign-in">Sign in</Link>
        <Link className="rounded-lg border border-slate-300 px-5 py-3 font-medium" href="/sign-up">Create account</Link>
      </div>
    </main>
  );
}

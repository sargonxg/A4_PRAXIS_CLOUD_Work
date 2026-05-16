import Link from 'next/link';

export const metadata = {
  title: '404 — Page Not Found | PRAXIS by TACITUS',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] text-slate-200 px-6 text-center gap-6">
      <div className="text-2xl font-bold tracking-widest text-[#E8B931]">PRAXIS</div>
      <div className="text-6xl font-bold text-slate-700 select-none">404</div>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-slate-400 max-w-sm leading-relaxed">
        The route you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/app/contexts"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-sm font-medium transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

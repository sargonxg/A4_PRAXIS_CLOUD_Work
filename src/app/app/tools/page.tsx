import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/admin-session';
import ToolsArchiveClient from './tools-archive-client';

export const dynamic = 'force-dynamic';

interface ToolsPageProps {
  searchParams: Promise<{ show_archive?: string }>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const admin = await getAdminSession();
  const canShowArchive = params.show_archive === '1' && Boolean(admin);

  if (!canShowArchive) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center gap-4 p-6" data-testid="canonical-tools-page">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Ask PRAXIS</p>
        <h1 className="text-3xl font-semibold tracking-tight text-navy-950">Tools stay behind next moves.</h1>
        <p className="text-sm leading-6 text-slate-700">
          The default workspace routes work through Ask PRAXIS and the active capsule. Direct tool catalogs are reserved for admin archive review.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-flex w-fit items-center rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Return to workspace
        </Link>
        {admin ? (
          <Link
            href="/app/tools?show_archive=1"
            className="inline-flex w-fit items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
          >
            Review archived tools
          </Link>
        ) : null}
      </main>
    );
  }

  return <ToolsArchiveClient />;
}

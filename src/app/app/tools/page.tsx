import Link from 'next/link';
import { Archive } from 'lucide-react';
import { ContextBuilderRoom } from '@/components/cores/ContextBuilderRoom';
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
      <>
        <ContextBuilderRoom initialMode="tools" />
        {admin ? (
          <aside className="mx-auto -mt-10 mb-12 max-w-[1400px] px-1">
            <Link
              href="/app/tools?show_archive=1"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
            >
              <Archive className="h-4 w-4" />
              Review archived tools
            </Link>
          </aside>
        ) : null}
      </>
    );
  }

  return <ToolsArchiveClient />;
}

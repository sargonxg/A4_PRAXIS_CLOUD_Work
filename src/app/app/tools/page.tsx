import Link from 'next/link';
import { Archive, Home } from 'lucide-react';
import { AppPageHeader } from '@/components/app/app-page-header';
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
        <AppPageHeader
          eyebrow="Advanced"
          title="Machinery stays here."
          subtitle="Normal work routes through Ask PRAXIS and the active context. Raw tools and archives are contained for review."
          primaryAction={{ label: 'Return to Home', href: '/app/dashboard', icon: Home }}
        />
        {admin ? (
          <Link
            href="/app/tools?show_archive=1"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
          >
            <Archive className="h-4 w-4" />
            Review archived tools
          </Link>
        ) : null}
      </main>
    );
  }

  return <ToolsArchiveClient />;
}

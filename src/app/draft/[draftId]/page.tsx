import Link from 'next/link';
import { DraftingShell } from '@/components/draft/DraftingShell';
import { getDraftShell } from '@/lib/draft/api';

export const metadata = {
  title: 'Draft | PRAXIS',
};

export default async function DraftDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ draftId: string }>;
  searchParams?: Promise<{ caseId?: string; template?: string }>;
}) {
  const [{ draftId }, query] = await Promise.all([params, searchParams]);
  const draft = getDraftShell(draftId, { caseId: query?.caseId, templateId: query?.template });

  if (!draft) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl border border-dashed border-slate-300 bg-white p-8">
          <p className="text-sm font-semibold uppercase text-slate-500">Drafting Studio</p>
          <h1 className="mt-2 text-2xl font-semibold">Draft not found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-650">
            This draft is not available in the local shell data. Create a new draft from a Context or return to the Drafting Studio inbox.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/draft" className="border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Back to drafts</Link>
            <Link href="/draft/new" className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">New draft</Link>
          </div>
        </section>
      </main>
    );
  }

  return <DraftingShell draft={draft} />;
}

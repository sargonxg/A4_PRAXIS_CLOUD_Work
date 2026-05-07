import { ACHIndex } from '@/components/sats/ACHWorkbench';

export default async function ACHIndexPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <ACHIndex caseId={caseId} />
      </div>
    </main>
  );
}

import { ACHDetail } from '@/components/sats/ACHWorkbench';

export default async function ACHDetailPage({
  params,
}: {
  params: Promise<{ caseId: string; achId: string }>;
}) {
  const { caseId, achId } = await params;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <ACHDetail caseId={caseId} achId={achId} />
      </div>
    </main>
  );
}

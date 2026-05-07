import { BoardroomLive } from '@/components/boardroom/BoardroomWorkspace';

export const dynamic = 'force-dynamic';

export default async function BoardroomLivePage({
  params,
}: {
  params: Promise<{ caseId: string; deliberationId: string }>;
}) {
  const { caseId, deliberationId } = await params;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <BoardroomLive caseId={caseId} deliberationId={deliberationId} />
      </div>
    </main>
  );
}

import { WorkbenchActiveCase } from '@/components/workbench/workbench-active-case';
import { normalizeWorkbenchTab } from '@/lib/workbench/tabs';

export default async function WorkbenchCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ caseId }, query] = await Promise.all([params, searchParams]);
  return <WorkbenchActiveCase caseId={caseId} activeTab={normalizeWorkbenchTab(query.tab)} />;
}

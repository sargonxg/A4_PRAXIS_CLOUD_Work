'use client';

import { ACHIndex } from '@/components/sats/ACHWorkbench';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function ACHChapter() {
  const { caseId } = useWorkbenchScope();
  return <ACHIndex caseId={caseId} />;
}

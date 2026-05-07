'use client';

import { BoardroomIndex } from '@/components/boardroom/BoardroomWorkspace';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function BoardroomChapter() {
  const { caseId } = useWorkbenchScope();
  return <BoardroomIndex caseId={caseId} />;
}

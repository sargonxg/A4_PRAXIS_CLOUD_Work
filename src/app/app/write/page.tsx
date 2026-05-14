import { MemoDesk } from '@/components/memo/memo-desk';

export const metadata = {
  title: 'Memo Studio | PRAXIS',
  description: 'Draft grounded policy memos with Ask PRAXIS, sources, and citations on every page.',
};

/**
 * /app/write — Memo Studio.
 *
 * The MemoDesk renders its own three-panel layout (Library · Editor ·
 * Ask PRAXIS) and breaks out of the AppShell padding so the surface
 * reads as a standalone document workspace.
 */
export default function WritePage() {
  return <MemoDesk />;
}

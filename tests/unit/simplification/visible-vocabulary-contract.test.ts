import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const TARGET_FILES = [
  'src/app/api/ai/chat/route.ts',
  'src/components/ask/AskWorkspacePage.tsx',
  'src/components/ask/AskStreamPanel.tsx',
  'src/components/ask/AskArtifactPreview.tsx',
  'src/components/app/advanced-explanation-panel.tsx',
  'src/components/app/floating-praxis.tsx',
  'src/components/cores/CapsuleReadinessRail.tsx',
  'src/components/cores/ContextBuilderRoom.tsx',
  'src/components/cores/CoreLibraryWorkbench.tsx',
  'src/components/onboarding/welcome-modal.tsx',
  'src/components/memo/memo-desk.tsx',
  'src/components/praxis/tasklet-praxis-workbench.tsx',
  'src/lib/agent-runtime/schema.ts',
  'src/lib/agent-runtime/reasoning-loop.ts',
  'src/lib/agent-runtime/worker.ts',
  'src/lib/ai/ask-answer-envelope.ts',
  'src/lib/ai/ask-orchestrator.ts',
  'src/lib/product/experience-map.ts',
  'src/lib/workbench/library-state.ts',
  'src/stores/notification-store.ts',
] as const;

const FORBIDDEN_VISIBLE_SNIPPETS = [
  'Home, Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced',
  'Route normal users to Ask PRAXIS, Library, Memo Studio, Canvas, or Advanced',
  '- **Library**:',
  '- **Memo Studio**:',
  '- **Canvas**:',
  '- **Advanced**:',
  'Send answer to Memo Studio',
  'Send to Memo Studio',
  'Save to Memo Studio',
  'Document pack saved to Memo Studio',
  'Advanced receipt',
  'tools from Advanced',
  'tools contained in Advanced',
  'tools routable from Advanced',
  'Advanced tools stay behind approval gates',
  'Open Canvas',
  'Library Upload',
  'Suggested actions appear in Ask and Memo Studio',
  'across Ask PRAXIS, Memo Studio, Canvas, and handoff',
  'route results back to Ask PRAXIS, Memo Studio, Canvas, or Library',
  'Review the result in Memo Studio, Canvas, Library, or handover',
  'Advanced routing details',
  'Advanced optional mirror',
  'Open Boardroom',
  'Start live boardroom',
  'Continue this as a Memo Studio',
  'Memo Studio draft',
  'document pack for Memo Studio',
  "return 'Memo Studio';",
  "return 'Canvas';",
] as const;

describe('PRAXIS visible vocabulary contract', () => {
  it('keeps first-run and Ask surfaces on Home/Capsules/Context/Sources/Work/Proof wording', () => {
    const violations: string[] = [];

    for (const file of TARGET_FILES) {
      const source = readFileSync(join(repoRoot, file), 'utf8');
      for (const snippet of FORBIDDEN_VISIBLE_SNIPPETS) {
        if (source.includes(snippet)) violations.push(`${file}: ${snippet}`);
      }
    }

    expect(violations).toEqual([]);
  });
});

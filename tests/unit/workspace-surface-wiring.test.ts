import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

describe('workspace surface wiring', () => {
  it('wires the Desk surface to the orchestrator SSE queue', () => {
    const desk = read('src/components/workbench/DeskTab.tsx');
    const panel = read('src/components/workbench/desk/NextBestActionsPanel.tsx');

    expect(desk).toContain("useOrchestratorEvents('workspace')");
    expect(desk).toContain('onConfirm={orchestrator.confirm}');
    expect(desk).toContain('onDismiss={orchestrator.dismiss}');
    expect(panel).toContain('desk-orchestrator-suggestions');
    expect(panel).toContain("kind === 'suggestion'");
  });

  it('surfaces Research recall turns as an analyst-visible ledger', () => {
    const research = read('src/components/workbench/ResearchTab.tsx');

    expect(research).toContain('research-thread-recall-ledger');
    expect(research).toContain('parseSseEvents');
    expect(research).toContain('recall_history');
    expect(research).toContain('Close thread → improve memory');
  });

  it('keeps backend research recall graph-grounded and citation-shaped', () => {
    const chapters = read('backend/routers/chapters.py');

    expect(chapters).toContain('CogneeSearchMode.GRAPH_COMPLETION');
    expect(chapters).toContain('node_set=[f"case_{thread[\'case_id\']}"]');
    expect(chapters).toContain('"citations": citations');
    expect(chapters).toContain('_build_recall_answer');
    expect(chapters).toContain('json.dumps([recall_turn])');
  });
});

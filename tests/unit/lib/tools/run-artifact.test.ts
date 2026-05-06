import { describe, expect, it } from 'vitest';
import {
  buildToolRunArtifact,
  persistToolRunArtifact,
  summarizeToolRunArtifact,
  type ToolRunArtifactRecord,
} from '@/lib/tools/marketplace/run-artifact';

describe('tool run artifacts', () => {
  it('builds tolerant records for raw text, generated output, and context dumps', () => {
    const artifact = buildToolRunArtifact({
      uid: 'u1',
      situationId: 's1',
      toolId: 'cross.context-health-explainer',
      prompt: 'explain gaps',
      rawText: 'Generated narrative can be stored as text.',
      structuredOutput: { claims: [{ text: 'Loose nested data is accepted.' }] },
      contextDump: { graph: { nodes: [] }, notes: 'free form context' },
    });

    expect(artifact.schemaVersion).toBe('tool-run-artifact-v1');
    expect(artifact.rawText).toContain('Generated narrative');
    expect(artifact.contextDump).toMatchObject({ notes: 'free form context' });
  });

  it('persists when any artifact payload exists', async () => {
    const writes: ToolRunArtifactRecord[] = [];
    const result = await persistToolRunArtifact({
      uid: 'u1',
      situationId: 's1',
      toolId: 'conflict.leverage-trace',
      contextDump: { text: 'context only is still useful' },
    }, {
      async setArtifact(_uid, _situationId, _artifactId, record) {
        writes.push(record);
      },
    });

    expect(result.persisted).toBe(true);
    expect(writes).toHaveLength(1);
  });

  it('skips empty artifacts without throwing', async () => {
    const result = await persistToolRunArtifact({
      uid: 'u1',
      situationId: 's1',
      toolId: 'conflict.leverage-trace',
    }, {
      async setArtifact() {
        throw new Error('empty artifact should not write');
      },
    });

    expect(result).toMatchObject({ persisted: false, reason: 'empty_artifact' });
  });

  it('summarizes persisted artifacts for marketplace history reload', () => {
    const artifact = buildToolRunArtifact({
      uid: 'u1',
      situationId: 's1',
      toolId: 'conflict.leverage-trace',
      prompt: 'trace leverage',
      rawText: 'Leverage trace raw output',
      structuredOutput: {
        summary: 'Leverage trace completed.',
        case: { contextHealth: { score: 72 } },
        advisories: [{ severity: 'warn' }, { severity: 'info' }],
      },
      metadata: { handlerStage: 'prompt-contract' },
    });

    expect(summarizeToolRunArtifact(artifact)).toMatchObject({
      id: artifact.id,
      toolId: 'conflict.leverage-trace',
      summary: 'Leverage trace completed.',
      rawText: 'Leverage trace raw output',
      handlerStage: 'prompt-contract',
      contextHealth: 72,
      advisoryCount: 2,
    });
  });
});

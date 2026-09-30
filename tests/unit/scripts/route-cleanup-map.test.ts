import { beforeAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { buildCleanupAudit, buildGraphReferenceCounts, countCandidateReferences } from '../../../scripts/audit-route-cleanup-map';
import type { CleanupAudit } from '../../../scripts/audit-route-cleanup-map';

describe('route cleanup map', () => {
  let audit: CleanupAudit;

  beforeAll(() => {
    audit = buildCleanupAudit();
  }, 30000);

  it('maps all API routes with conservative cleanup dispositions', () => {
    expect(audit.totalRoutes).toBeGreaterThanOrEqual(207);
    expect(audit.routeMap).toHaveLength(audit.totalRoutes);
    expect(audit.routeMap.every((entry) => entry.disposition)).toBe(true);
    expect(audit.routeMap.every((entry) => entry.methods.length > 0 || entry.callerEvidence.length > 0)).toBe(true);
    expect(audit.routeMap.every((entry) => entry.dataStores.length > 0)).toBe(true);
    expect(audit.summary['delete candidate']).toBe(0);
  });

  it('preserves canonical visible and agentic runtime surfaces', () => {
    expect(audit.visibleSurfaces.map((entry) => entry.path)).toEqual([
      '/',
      '/login',
      '/app',
      '/app/capsules',
      '/app/repository',
      '/app/settings',
      '/agents/[runId]',
    ]);
    expect(audit.agenticRuntime.every((entry) => entry.status !== 'blocked')).toBe(true);
    expect(audit.routeMap.find((entry) => entry.route === '/api/agents/runs')?.disposition).toBe('do not touch');
    expect(audit.routeMap.find((entry) => entry.route === '/api/conversations/[conversationId]/turns')?.disposition).toBe('do not touch');
  });
});

describe('route cleanup literal indexes', () => {
  it('preserves literal, dynamic-prefix and non-overlapping graph counts', () => {
    const graphText = '/api/notes/a /api/notes/[id] /api/notes-other /api/notes/a '
      + '/api/agents/a /api/agents/[...path] /api/api/api/api/api';
    const routeLiterals = new Map([
      ['/api/notes', ['/api/notes']],
      ['/api/notes/[id]', ['/api/notes/[id]', '/api/notes/']],
      ['/api/agents/[...path]', ['/api/agents/[...path]', '/api/agents/']],
      ['/api/api/api', ['/api/api/api']],
      ['/api/unused', ['/api/unused']],
    ]);
    const counts = buildGraphReferenceCounts([...routeLiterals.keys()], graphText);
    for (const [route, literals] of routeLiterals) {
      expect(counts.get(route)).toBe(literals.reduce((count, literal) => count + graphText.split(literal).length - 1, 0));
    }
    expect(buildGraphReferenceCounts([...routeLiterals.keys()], '').get('/api/notes')).toBe(0);
  });

  it('preserves per-file reference counts, shared stems and self-exclusion', () => {
    const fileTexts = new Map([
      ['src/a/shared.ts', 'own source without a reference'],
      ['src/b/shared.ts', 'shared shared src/a/shared.ts'],
      ['src/other.ts', 'prefix-shared-suffix'],
      ['docs/readme.md', 'src/a/shared.ts'],
      ['scripts/tool.mjs', 'unrelated content'],
    ]);
    const stemCounts = new Map<string, number>();
    for (const file of fileTexts.keys()) {
      const stem = path.basename(file).replace(/\.(tsx|ts|mjs|md)$/, '');
      const previousCount = [...fileTexts].filter(([otherFile, text]) => otherFile !== file
        && (text.includes(file) || text.includes(stem))).length;
      expect(countCandidateReferences(file, fileTexts, stemCounts)).toBe(previousCount);
    }
    expect(stemCounts.size).toBe(fileTexts.size - 1);
  });
});

import { describe, expect, it } from 'vitest';
import { auditAppSearchContracts } from '../../../scripts/audit-app-search';
import { APP_SEARCH_COMMANDS } from '@/lib/app-search/shared-contracts';

describe('audit:app-search', () => {
  it('keeps command ids unique, routes local, diagnostics endpoint-backed, and graph freshness classified', () => {
    const result = auditAppSearchContracts({
      cwd: process.cwd(),
      headCommit: 'def4567890',
      graphReport: '# Graph Report\n\n## Graph Freshness\n- Built from commit: `abc123`\n',
    });

    expect(result.failures).toEqual([]);
    expect(result.redFlags).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'graphify-freshness',
        status: 'stale',
        source: 'local audit',
      }),
    ]));
  });

  it('accepts query-backed registered pages and rejects external, traversal and unknown targets', () => {
    const originalLength = APP_SEARCH_COMMANDS.length;
    const targets = [
      '/app?prompt=Review+the+evidence',
      '/app/capsules?lane=sources',
      '/app/capsules/builder?step=purpose',
      '/app/recent-work?source=search',
      'https://example.com/app',
      '//example.com/app',
      '/app/../login',
      '/app/unknown',
      '/api/health/runtime',
    ];
    try {
      APP_SEARCH_COMMANDS.push(...targets.map((href, index) => ({
        id: `audit-target:${index}`, label: 'Audit route', description: 'Route fixture',
        kind: 'Action' as const, keywords: [], href,
      })));
      const { failures } = auditAppSearchContracts({
        cwd: process.cwd(), headCommit: 'abc123', graphReport: 'Built from commit: `abc123`',
      });
      for (let index = 0; index < 4; index += 1) {
        expect(failures.some((failure) => failure.startsWith(`audit-target:${index} `))).toBe(false);
      }
      for (let index = 4; index < targets.length; index += 1) {
        expect(failures).toContain(`audit-target:${index} points outside existing app routes: ${targets[index]}`);
      }
    } finally {
      APP_SEARCH_COMMANDS.splice(originalLength);
    }
  });
});

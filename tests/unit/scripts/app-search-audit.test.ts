import { describe, expect, it } from 'vitest';
import { auditAppSearchContracts } from '../../../scripts/audit-app-search';

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
});

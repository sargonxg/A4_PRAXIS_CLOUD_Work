import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageSource = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
const auditSource = readFileSync(join(process.cwd(), 'scripts/audit-research-graph.ts'), 'utf8');

describe('research graph audit contract', () => {
  it('wires the optional Research graph audit and checks the safety boundary', () => {
    expect(packageSource).toContain('"audit:research-graph"');
    expect(auditSource).toContain('src/lib/research-graph');
    expect(auditSource).toContain('rejectRawResearchGraphQuery');
    expect(auditSource).toContain('RESEARCH_GRAPH_ENABLED');
    expect(auditSource).toContain('GDELT_BIGQUERY_ENABLED');
    expect(auditSource).toContain('RESEARCH_GRAPH_MAX_BYTES_BILLED');
    expect(auditSource).toContain('Wikidata');
    expect(auditSource).toContain('GDELT');
    expect(auditSource).toContain('docs/COMPLIANCE.md');
    expect(auditSource).not.toContain('SELECT *');
  });
});

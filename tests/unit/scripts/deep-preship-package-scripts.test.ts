import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deep pre-ship package scripts', () => {
  it('wires the named audit scripts used by the pre-ship checklist', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };

    for (const script of [
      'audit:workspace-tabs-chapters',
      'audit:substrate-writers',
      'audit:orchestrator-writes',
      'audit:ontology-system',
    ]) {
      expect(packageJson.scripts[script]).toBeTruthy();
    }
  });
});

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { auditModelMatrixCoverage } from '../../../scripts/audit-model-matrix-coverage';

let tempRoots: string[] = [];

describe('audit:model-matrix-coverage', () => {
  afterEach(() => {
    for (const tempRoot of tempRoots) rmSync(tempRoot, { recursive: true, force: true });
    tempRoots = [];
  });

  it('sanctions the matrix Gemini 3.5 family and Gemini 2.5 stable fallbacks', () => {
    const repoRoot = createRepoScanRoot();

    const result = auditModelMatrixCoverage(repoRoot);

    expect(result.ok).toBe(true);
    expect(result.sanctionedGemini35Ids).toEqual(['gemini-3.5-flash']);
  });

  it('keeps deprecated and withdrawn Gemini IDs forbidden in source scans', () => {
    const repoRoot = createRepoScanRoot();
    writeFileSync(
      path.join(repoRoot, 'src', 'forbidden-model.ts'),
      "export const removed = ['gemini-2.0-flash', 'gemini-3-pro-preview'];\n",
      'utf8'
    );

    const result = auditModelMatrixCoverage(repoRoot);

    expect(result.ok).toBe(false);
    expect(result.failures.join('\n')).toContain('gemini-2.0-*');
    expect(result.failures.join('\n')).toContain('gemini-3-pro-preview');
  });
});

function createRepoScanRoot(): string {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), 'praxis-model-matrix-audit-'));
  mkdirSync(path.join(repoRoot, 'src'));
  mkdirSync(path.join(repoRoot, 'backend'));
  tempRoots.push(repoRoot);
  return repoRoot;
}

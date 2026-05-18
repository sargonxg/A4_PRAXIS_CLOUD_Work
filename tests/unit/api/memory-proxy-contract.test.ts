import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Cognee memory proxy contract', () => {
  const route = readFileSync(join(process.cwd(), 'src/app/api/memory/[...slug]/route.ts'), 'utf8');

  it('keeps memory operations on the review-gated allowlist', () => {
    expect(route).toContain("pattern: /^remember$/");
    expect(route).toContain("pattern: /^recall$/");
    expect(route).toContain("pattern: /^candidates$/");
    expect(route).toContain("pattern: /^promote$/");
    expect(route).toContain("pattern: /^reject$/");
  });

  it('forwards owner and capsule scope to the isolated Cognee service', () => {
    expect(route).toContain("'X-PRAXIS-UID': uid");
    expect(route).toContain("'X-PRAXIS-MEMORY-DATASET'");
    expect(route).toContain("'X-PRAXIS-CASE-ID'");
    expect(route).toContain('cogneeDatasetFor');
  });

  it('does not charge or proxy write operations when Cognee is disabled', () => {
    expect(route).toContain('memory_layer_disabled');
    expect(route).toContain("path === 'remember'");
    expect(route).toContain("path === 'recall'");
  });
});

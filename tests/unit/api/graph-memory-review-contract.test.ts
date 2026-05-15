import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('graph proposal and memory review contract', () => {
  it('keeps graph proposal approval and rejection review-gated', () => {
    const approve = read('src/app/api/graph/proposals/[id]/approve/route.ts');
    const reject = read('src/app/api/graph/proposals/[id]/reject/route.ts');

    expect(approve).toContain('applyApprovedProposal');
    expect(approve).toContain('withAuth');
    expect(reject).toContain('rejectProposal');
    expect(reject).toContain('withAuth');
  });

  it('keeps working memory deletable through the owner-scoped route without reusing deleted facts', () => {
    const route = read('src/app/api/memory/working/[factId]/route.ts');
    const list = read('src/app/api/memory/working/route.ts');

    expect(route).toContain('collection(\'working-memory\')');
    expect(route).toContain('export const DELETE');
    expect(route).toContain('deletedAt');
    expect(route).not.toContain('await ref.delete()');
    expect(list).toContain('deletedAt');
  });
});

function read(rel: string): string {
  const full = join(process.cwd(), rel);
  expect(existsSync(full)).toBe(true);
  return readFileSync(full, 'utf8');
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('working memory route contract', () => {
  it('soft-deletes owner-scoped memory and excludes deleted facts from reads', () => {
    const listRoute = readFileSync(join(process.cwd(), 'src/app/api/memory/working/route.ts'), 'utf8');
    const factRoute = readFileSync(join(process.cwd(), 'src/app/api/memory/working/[factId]/route.ts'), 'utf8');

    expect(listRoute).toContain(".collection('users')");
    expect(listRoute).toContain('.doc(uid)');
    expect(listRoute).toContain('!(');
    expect(listRoute).toContain('deletedAt');
    expect(factRoute).toContain('.doc(uid)');
    expect(factRoute).toContain('deletedAt');
    expect(factRoute).not.toContain('await ref.delete()');
  });
});

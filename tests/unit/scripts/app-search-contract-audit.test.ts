import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('app search contract audit source', () => {
  it('checks auth, unified API wiring, forbidden external search imports, and test coverage markers', () => {
    const source = readFileSync(join(process.cwd(), 'scripts/audit-app-search-contract.ts'), 'utf8');

    expect(source).toContain('src/app/api/app/search/route.ts');
    expect(source).toContain('withAuth');
    expect(source).toContain('src/components/shared/global-search.tsx');
    expect(source).toContain('/api/app/search');
    expect(source).toContain('forbiddenExternalMarkers');
    expect(source).toContain('tests/unit/app/api/app-search-route.test.ts');
    expect(source).toContain('tests/unit/lib/app-search.test.ts');
  });
});

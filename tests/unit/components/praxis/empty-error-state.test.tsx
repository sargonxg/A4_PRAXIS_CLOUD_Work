import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('frontend empty/error/loading state contract', () => {
  const root = process.cwd();

  it('keeps active app loading surfaces on the shared Skeleton primitive', () => {
    const loading = readFileSync(path.join(root, 'src/app/app/loading.tsx'), 'utf8');

    expect(loading).toContain('Skeleton');
  });

  it('keeps active app state copy explicit for empty, error, and retry states', () => {
    const source = [
      readFileSync(path.join(root, 'src/app/app/loading.tsx'), 'utf8'),
      readFileSync(path.join(root, 'src/proxy.ts'), 'utf8'),
    ].join('\n');

    expect(source).toContain('EmptyState');
    expect(source).toContain('ErrorState');
    expect(source).toContain('Retry');
    expect(source).toContain('Permissions-Policy');
  });
});

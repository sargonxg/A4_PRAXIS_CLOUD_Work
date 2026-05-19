import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('staged graph route archive posture', () => {
  it('hides the retired approve-staged route behind an archive response', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/api/graph/approve-staged/route.ts'), 'utf8');

    expect(source).toContain('archived_graph_staging_route');
    expect(source).toContain('status: 410');
  });

  it('hides the retired staging-stream route behind an archive response', () => {
    const source = readFileSync(path.join(process.cwd(), 'src/app/api/graph/staging-stream/route.ts'), 'utf8');

    expect(source).toContain('archived_graph_staging_route');
    expect(source).toContain('status: 410');
  });
});

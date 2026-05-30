import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('drafting action route', () => {
  it('is calibrated and persists tool output', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/ai/drafting-action/route.ts'), 'utf8');

    expect(source).toContain('withCalibration');
    expect(source).toContain('saveToolOutput');
    expect(source).toContain('redraft');
    expect(source).toContain('fact-check');
  });
});

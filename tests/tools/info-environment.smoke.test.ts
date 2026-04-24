import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('info-environment smoke', () => {
  it('route file wraps in withCalibration', () => {
    const path = join(process.cwd(), 'src/app/api/ai/info-environment/route.ts');
    const src = readFileSync(path, 'utf8');
    expect(src).toContain('withCalibration');
    expect(src).toMatch(/withCalibration\s*\(\s*['"]info_environment['"]/);
  });
});

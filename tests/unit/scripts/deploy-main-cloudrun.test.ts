import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Windows-safe main deploy wrapper', () => {
  it('computes HEAD, submits quoted substitutions, and verifies the served commit', () => {
    const scriptPath = join(process.cwd(), 'scripts/deploy-main-cloudrun.ps1');
    expect(existsSync(scriptPath)).toBe(true);
    const source = readFileSync(scriptPath, 'utf8');

    expect(source).toContain('git rev-parse HEAD');
    expect(source).toContain('_SOURCE_COMMIT=$HeadCommit');
    expect(source).toContain('gcloud builds submit');
    expect(source).toContain('--substitutions');
    expect(source).toContain('/api/health/runtime');
    expect(source).toContain('if ($ServedCommit -ne $HeadCommit)');
  });

  it('is exposed through package scripts as the manual fallback path', () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(packageJson.scripts['deploy:frontend:main-safe']).toBe('powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-main-cloudrun.ps1');
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
const runner = readFileSync('scripts/audit-runner.ts', 'utf8');

describe('audit runner consolidation', () => {
  it('routes launch, gate, routes, and simplification through the modular runner', () => {
    expect(packageJson.scripts['audit:launch']).toBe('tsx scripts/audit-runner.ts launch');
    expect(packageJson.scripts['audit:gate']).toBe('tsx scripts/audit-runner.ts gate');
    expect(packageJson.scripts['audit:routes']).toBe('tsx scripts/audit-runner.ts routes');
    expect(packageJson.scripts['audit:simplification']).toBe('tsx scripts/audit-runner.ts simplification');
    expect(packageJson.scripts['internal:audit-routes']).toContain('audit-ai-routes.mjs');
  });

  it('keeps the ship gate explicit and grouped by durable leaf checks', () => {
    expect(runner).toContain('GROUPS.launch');
    expect(runner).toContain("script: 'audit:launch-readiness'");
    expect(runner).toContain("script: 'audit:public-surface'");
    expect(runner).toContain("script: 'audit:agent-runtime-proof'");
    expect(runner).toContain("script: 'audit:capsule-v3'");
  });
});

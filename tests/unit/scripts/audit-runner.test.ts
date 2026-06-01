import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
const runner = readFileSync('scripts/audit-runner.ts', 'utf8');
const repoShape = readFileSync('scripts/audit-repo-shape.ts', 'utf8');
const toolContracts = readFileSync('scripts/audit-tool-contracts.ts', 'utf8');
const deepPreship = readFileSync('scripts/audit-deep-preship.ts', 'utf8');
const capsuleDepth = readFileSync('scripts/audit-capsule-depth.ts', 'utf8');
const capsuleConsolidation = readFileSync('scripts/audit-capsule-consolidation.ts', 'utf8');
const capsuleResearchDossiers = readFileSync('scripts/audit-capsule-research-dossiers.ts', 'utf8');
const capsuleBackfill = readFileSync('scripts/audit-capsule-backfill-readiness.ts', 'utf8');
const capsuleGraphLite = readFileSync('scripts/audit-capsule-graphlite-projections.ts', 'utf8');

describe('audit runner consolidation', () => {
  it('routes launch, gate, routes, and simplification through the modular runner', () => {
    expect(packageJson.scripts['audit:launch']).toBe('tsx scripts/audit-runner.ts launch');
    expect(packageJson.scripts['audit:gate']).toBe('tsx scripts/audit-runner.ts gate');
    expect(packageJson.scripts['audit:routes']).toBe('tsx scripts/audit-runner.ts routes');
    expect(packageJson.scripts['audit:simplification']).toBe('tsx scripts/audit-runner.ts simplification');
    expect(packageJson.scripts['audit:capsules']).toBe('tsx scripts/audit-runner.ts capsules');
    expect(packageJson.scripts['audit:agents']).toBe('tsx scripts/audit-runner.ts agents');
    expect(packageJson.scripts['audit:surface']).toBe('tsx scripts/audit-runner.ts surface');
    expect(packageJson.scripts['internal:audit-routes']).toContain('audit-ai-routes.mjs');
  });

  it('keeps the ship gate explicit and grouped by durable audit lanes', () => {
    expect(runner).toContain('GROUPS.launch');
    expect(runner).toContain('GROUPS.capsules');
    expect(runner).toContain('GROUPS.agents');
    expect(runner).toContain('GROUPS.surface');
    expect(runner).toContain('DROPPED_AUDIT_LEAVES');
    expect(runner).toContain('audit:path-coverage');
    expect(runner).toContain("script: 'audit:launch-readiness'");
    expect(runner).toContain("script: 'audit:public-surface'");
    expect(runner).toContain("script: 'audit:agent-runtime-proof'");
    expect(runner).toContain("script: 'audit:capsule-v3'");
  });

  it('keeps generated audit output on rolling LATEST files', () => {
    expect(repoShape).toContain('docs/audits/LATEST-baseline.md');
    expect(toolContracts).toContain('LATEST-tool-contracts.md');
    expect(deepPreship).toContain('LATEST-DEEP_PRESHIP_CHECKLIST.md');
    for (const source of [
      capsuleDepth,
      capsuleConsolidation,
      capsuleResearchDossiers,
      capsuleBackfill,
      capsuleGraphLite,
    ]) {
      expect(source).toContain('LATEST-');
      expect(source).not.toMatch(/docs[\\/']\s*,\s*'audits'[\s\S]{0,160}'2026-/);
    }
    expect(toolContracts).not.toContain('tool-contracts-${new Date()');
    expect(deepPreship).not.toContain('${today}-DEEP_PRESHIP_CHECKLIST');
  });
});

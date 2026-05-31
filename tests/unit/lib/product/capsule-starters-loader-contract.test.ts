import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('capsule starter Firestore loader contract', () => {
  const root = process.cwd();

  it('keeps starter reads behind a cached server loader instead of importing the giant catalog in client surfaces', () => {
    const loader = readFileSync(join(root, 'src/lib/product/capsule-starters.ts'), 'utf8');
    const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
    const askWorkspace = readFileSync(join(root, 'src/components/ask/AskWorkspacePage.tsx'), 'utf8');

    expect(loader).toContain('config/capsule_starters');
    expect(loader).toContain('config/capsule_starters_history');
    expect(loader).toContain('CACHE_TTL_MS');
    expect(loader).toContain('listCapsuleStarterDefinitions');
    expect(loader).toContain('getCapsuleStarterDefinition');
    expect(workbench).not.toContain("from '@/lib/product/context-capsules'");
    expect(askWorkspace).not.toContain("from '@/lib/product/context-capsules'");
  });

  it('adds an idempotent Firestore seed script gated by the admin allowlist', () => {
    const script = readFileSync(join(root, 'scripts/seed-capsule-starters.ts'), 'utf8');

    expect(script).toContain('config/capsule_starters');
    expect(script).toContain('config/capsule_starters_history');
    expect(script).toContain('ADMIN_ALLOWLIST');
    expect(script).toContain('contentHash');
    expect(script).toContain('{ merge: true }');
  });
});

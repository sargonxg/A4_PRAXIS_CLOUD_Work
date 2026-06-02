import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTEXT_CREATION_MODES } from '@/lib/context/context-core-lite';

const repoRoot = process.cwd();
const builderSource = readFileSync(
  join(repoRoot, 'src/components/context/one-click-context-builder.tsx'),
  'utf8',
);
const quickBuilderSource = readFileSync(
  join(repoRoot, 'src/lib/context/quick-context-builder-client.ts'),
  'utf8',
);

describe('Context Core Lite UI contract', () => {
  it('shows both modes on the same context builder screen', () => {
    expect(CONTEXT_CREATION_MODES.map((mode) => mode.label)).toEqual([
      'Context Core Lite',
      'DIALECTICA Core Builder',
    ]);
    expect(CONTEXT_CREATION_MODES.map((mode) => mode.statusLabel)).toEqual([
      'Available now',
      'Coming soon',
    ]);
    expect(builderSource).toContain('CONTEXT_CREATION_MODES.map');
    expect(builderSource).toContain('Use Context Core Lite now. Build full cores with DIALECTICA by TACITUS later.');
  });

  it('keeps DIALECTICA future mode visible but not live', () => {
    expect(builderSource).toContain("mode === 'dialectica_future'");
    expect(builderSource).toContain('DIALECTICA Core Builder is future/adapter-ready.');
    expect(builderSource).toContain('PRAXIS will consume exported cores through');
    expect(builderSource).toContain('disabled={busy || !canCreateWithMode(mode)}');
    expect(builderSource).toContain("mode === 'praxis_lite' ? 'Create Context Core Lite' : 'Coming soon'");
  });

  it('keeps the PRAXIS Lite creation path on existing context APIs', () => {
    expect(builderSource).toContain('createQuickContextFromDomain');
    expect(quickBuilderSource).toContain("'/api/situations'");
    expect(quickBuilderSource).toContain("'/api/context/capsules'");
    expect(quickBuilderSource).toContain("'/api/context/packages'");
    expect(quickBuilderSource).toContain("'/api/context/resolve'");
    expect(quickBuilderSource).toContain('contextPackageId: contextPackage.id');
    expect(quickBuilderSource).toContain('capsuleId: capsule.capsuleId');
  });
});

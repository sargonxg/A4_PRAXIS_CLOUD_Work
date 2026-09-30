import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const login = readFileSync(join(root, 'src/app/(auth)/login/page.tsx'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('PRAXIS shared ordered-connection background', () => {
  it('defines a shared checkered constellation surface with ordered grid and colored points', () => {
    expect(globals).toContain('.praxis-checker-constellation');
    expect(globals).toContain('--praxis-point-rose');
    expect(globals).toContain('--praxis-point-sage');
    expect(globals).toContain('--praxis-point-emerald');
    expect(globals).toContain('--praxis-connection-line');
    expect(globals).toContain('radial-gradient(circle at 11px 19px');
    expect(globals).toContain('linear-gradient(32deg, transparent');
    expect(globals).toContain('radial-gradient(circle at 12px 12px');
    expect(globals).toContain('conic-gradient(from 90deg at 1px 1px');
  });

  it('uses quiet Civic paper at login and in the shared workspace while retaining contextual graph surfaces', () => {
    expect(login).toContain('var(--color-archive-paper-strong)');
    const shell = readFileSync(join(root, 'src/components/app/app-shell.tsx'), 'utf8');
    expect(shell).toContain('praxis-workspace');
    expect(globals).toMatch(/\.praxis-workspace\s*\{\s*background:\s*var\(--color-archive-paper-strong\)/);
    expect(globals).toContain('.praxis-workspace .praxis-focus-surface { background: transparent; }');
    expect(workbench).toContain('praxis-checker-constellation');
    expect(readFileSync(join(root, 'src/components/app/praxis-chat-first-shell.tsx'), 'utf8')).toContain('praxis-focus-surface');
    expect(login).not.toContain('backgroundImage: `radial-gradient(circle at 1px 1px');
    expect(login).not.toContain('bg-[linear-gradient(rgba(15,23,42,0.035)_1px');
  });

  it('keeps composer and taxonomy affordances opaque over the graph background', () => {
    expect(globals).toContain('.praxis-composer-input-well');
    expect(globals).toContain('.capsule-taxonomy-panel-solid');
    expect(globals).toContain('var(--color-archive-paper-strong)');
    expect(workbench).toContain('praxis-composer-input-well');
    expect(workbench).toContain('capsule-taxonomy-panel-solid');
  });
});

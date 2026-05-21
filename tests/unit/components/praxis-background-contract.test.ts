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
    expect(globals).toContain('--praxis-point-gold');
    expect(globals).toContain('--praxis-connection-line');
    expect(globals).toContain('radial-gradient(circle at 11px 19px');
    expect(globals).toContain('linear-gradient(32deg, transparent');
  });

  it('uses the same background class before and after login without separate inline dot grids', () => {
    expect(login).toContain('praxis-checker-constellation');
    expect(workbench).toContain('praxis-checker-constellation');
    expect(login).not.toContain('backgroundImage: `radial-gradient(circle at 1px 1px');
    expect(login).not.toContain('bg-[linear-gradient(rgba(15,23,42,0.035)_1px');
  });
});

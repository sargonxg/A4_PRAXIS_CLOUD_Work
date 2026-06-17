import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('agent workspace route contract', () => {
  it('exposes canonical /agents/[runId] route through the shared PRAXIS workbench', () => {
    const routePath = path.join(root, 'src/app/agents/[runId]/page.tsx');

    expect(existsSync(routePath)).toBe(true);

    const routeSource = readFileSync(routePath, 'utf8');
    expect(routeSource).toContain('TaskletPraxisWorkbench');
    expect(routeSource).toContain('focusedRunId');
    expect(routeSource).toContain('className="app-light praxis-app-surface"');
    expect(routeSource).toContain('praxis-checker-constellation');
  });

  it('keeps the workbench focused-run mode wired to the agent run API', () => {
    const workbenchSource = readFileSync(path.join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

    expect(workbenchSource).toContain('focusedRunId');
    expect(workbenchSource).toContain('/api/agents/runs/${encodeURIComponent(runId)}');
    expect(workbenchSource).toContain("router.push(`/agents/${encodeURIComponent(run.runId)}`)");
  });
});

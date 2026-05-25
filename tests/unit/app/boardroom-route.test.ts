import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/app/boardroom workspace contract', () => {
  const pageSource = readFileSync(join(process.cwd(), 'src/app/app/boardroom/page.tsx'), 'utf8');
  const componentSource = readFileSync(join(process.cwd(), 'src/components/boardroom/boardroom-workspace.tsx'), 'utf8');
  const primaryNavSource = readFileSync(join(process.cwd(), 'src/lib/navigation/primary-nav.ts'), 'utf8');
  const appShellSource = readFileSync(join(process.cwd(), 'src/components/app/app-shell.tsx'), 'utf8');
  const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

  it('renders the three required boardroom regions inside the authenticated app', () => {
    expect(pageSource).toContain('<BoardroomWorkspace');
    expect(componentSource).toContain('data-testid="boardroom-context-builder"');
    expect(componentSource).toContain('data-testid="boardroom-capsule-selector"');
    expect(componentSource).toContain('data-testid="boardroom-upload-dropzone"');
    expect(componentSource).toContain('data-testid="boardroom-paste-source"');
    expect(componentSource).toContain('data-testid="boardroom-evidence-chips"');
    expect(componentSource).toContain('data-testid="boardroom-canvas"');
    expect(componentSource).toContain('data-testid="boardroom-run-panel"');
    expect(componentSource).toContain('data-testid="boardroom-participant-picker"');
    expect(componentSource).toContain('/api/boardroom/runs');
    expect(componentSource).toContain('/api/context/capsules');
    expect(componentSource).toContain('/api/documents/upload');
    expect(componentSource).toContain('/api/agents/runs/${encodeURIComponent(runId)}');
    expect(componentSource).toContain('/api/agents/runs/${encodeURIComponent(runId)}/stream');
  });

  it('keeps boardroom out of primary navigation inside the normal app shell', () => {
    expect(primaryNavSource).not.toContain('/app/boardroom');
    expect(primaryNavSource).not.toContain("id: 'boardroom'");
    expect(appShellSource).not.toContain("pathname === '/app/boardroom'");
    expect(appShellSource).toContain('CoreContextStrip');
  });

  it('keeps Home and Capsules launch compatibility for the side workspace', () => {
    expect(workbenchSource).toContain('data-testid="open-boardroom-workspace-cta"');
    expect(workbenchSource).toContain('data-testid="capsule-studio-boardroom-action"');
    expect(workbenchSource).toContain("href=\"/app/boardroom\"");
  });
});

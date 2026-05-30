import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/app/boardroom workspace contract', () => {
  const pageSource = readFileSync(join(process.cwd(), 'src/app/app/boardroom/page.tsx'), 'utf8');
  const componentSource = readFileSync(join(process.cwd(), 'src/components/boardroom/boardroom-workspace.tsx'), 'utf8');
  const primaryNavSource = readFileSync(join(process.cwd(), 'src/lib/navigation/primary-nav.ts'), 'utf8');
  const appShellSource = readFileSync(join(process.cwd(), 'src/components/app/app-shell.tsx'), 'utf8');
  const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

  it('renders a simplified homepage-style live boardroom surface inside the authenticated app', () => {
    expect(pageSource).toContain('<BoardroomWorkspace');
    expect(componentSource).toContain('data-testid="boardroom-home-surface"');
    expect(componentSource).toContain('data-testid="boardroom-main-composer"');
    expect(componentSource).toContain('data-testid="boardroom-context-notes"');
    expect(componentSource).toContain('data-testid="boardroom-agent-stage"');
    expect(componentSource).toContain('data-testid="boardroom-deep-research-agents"');
    expect(componentSource).toContain('data-testid="boardroom-live-proof"');
    expect(componentSource).toContain('data-testid="boardroom-run-panel"');
    expect(componentSource).toContain('Your Personal Knowledge Board');
    expect(componentSource).toContain('Electa');
    expect(componentSource).toContain('Deep research');
    expect(componentSource).toContain('directContext: directContext || undefined');
    expect(componentSource).toContain('/api/boardroom/runs');
    expect(componentSource).toContain('/api/agents/runs/${encodeURIComponent(runId)}');
    expect(componentSource).toContain('/api/agents/runs/${encodeURIComponent(runId)}/stream');
  });

  it('removes the old context-builder, capsule picker, upload, and manual roster workflow', () => {
    expect(componentSource).not.toContain('data-testid="boardroom-context-builder"');
    expect(componentSource).not.toContain('data-testid="boardroom-capsule-selector"');
    expect(componentSource).not.toContain('data-testid="boardroom-upload-dropzone"');
    expect(componentSource).not.toContain('data-testid="boardroom-paste-source"');
    expect(componentSource).not.toContain('data-testid="boardroom-evidence-chips"');
    expect(componentSource).not.toContain('data-testid="boardroom-participant-picker"');
    expect(componentSource).not.toContain('/api/context/capsules');
    expect(componentSource).not.toContain('/api/documents/upload');
    expect(componentSource).not.toContain('Context builder');
    expect(componentSource).not.toContain('Paste text as source');
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
    expect(workbenchSource).toContain('Your Personal Knowledge Board');
    expect(workbenchSource).not.toContain('Start deep review');
    expect(workbenchSource).toContain("href=\"/app/boardroom\"");
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const inboxPath = join(root, 'src/components/runs/approval-inbox.tsx');
const dockPath = join(root, 'src/components/app/ask-context-bar.tsx');

describe('approval inbox contract', () => {
  it('exposes stable badge, panel, item, and decision test ids', () => {
    const source = readFileSync(inboxPath, 'utf8');

    expect(source).toContain('data-testid="approval-inbox-badge"');
    expect(source).toContain('data-testid="approval-inbox-panel"');
    expect(source).toContain('data-testid="approval-inbox-item"');
    expect(source).toContain('data-testid="approval-inbox-approve"');
    expect(source).toContain('data-testid="approval-inbox-reject"');
    expect(source).toContain('/api/agents/runs/');
    expect(source).toContain('/approvals/');
  });

  it('renders from the existing capsule dock instead of adding a new page', () => {
    const source = readFileSync(dockPath, 'utf8');

    expect(source).toContain('data-testid="capsule-dock"');
    expect(source).toContain('ApprovalInboxButton');
  });
});

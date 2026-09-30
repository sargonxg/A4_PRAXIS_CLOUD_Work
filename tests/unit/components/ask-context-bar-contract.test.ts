import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const askContextBarPath = join(root, 'src/components/app/ask-context-bar.tsx');
const inlineBuilderPath = join(root, 'src/components/context/inline-quick-context-builder.tsx');
const praxisChatPath = join(root, 'src/components/app/praxis-chat.tsx');
const chatShellPath = join(root, 'src/components/app/praxis-chat-first-shell.tsx');
const floatingPraxisPath = join(root, 'src/components/app/floating-praxis.tsx');

describe('Ask context bar contract', () => {
  it('keeps named, versioned context inside the composer with technical detail disclosed on demand', () => {
    expect(existsSync(askContextBarPath)).toBe(true);
    const barSource = readFileSync(askContextBarPath, 'utf8');
    const chatSource = readFileSync(praxisChatPath, 'utf8');
    const shellSource = readFileSync(chatShellPath, 'utf8');
    const floatingSource = readFileSync(floatingPraxisPath, 'utf8');

    expect(chatSource).toContain('contextBar?: ReactNode');
    expect(chatSource.indexOf('{contextBar')).toBeGreaterThan(chatSource.indexOf('<form onSubmit={submit}'));
    expect(chatSource.indexOf('{contextBar')).toBeLessThan(chatSource.indexOf('type="submit"'));
    expect(shellSource).toContain('<AskContextBar');
    expect(shellSource).toContain('contextBar={');
    expect(floatingSource).toContain('<AskContextBar');
    expect(floatingSource).toContain('contextBar={');

    for (const required of [
      'data-testid="ask-context-bar"',
      'data-testid="capsule-dock"',
      'data-testid="capsule-dock-chip"',
      'data-testid="capsule-dock-slots"',
      'data-testid="capsule-dock-stack"',
      'data-testid="capsule-dock-warning"',
      'data-testid="attached-context-chips"',
      'triggerLabel="Attach context"',
      'aria-label={`Detach ${item.label}`}',
      'item.versionLabel',
      'label: capsule?.label',
      'version: capsule?.version',
      'detailsOpen ? <section',
      'Capsule Dock',
      'Stack:',
      'stackPolicyLabel',
      'contextPackageLabel',
      'User',
      'Situation',
      'Tool',
      'Sources',
      'Output',
      'Capsules',
      'Readiness',
      'Attach {dockSlots.slots.find',
      'Build context',
      'Pick capsule',
      'Clear context',
      'CapsuleListPicker',
      'InlineQuickContextBuilder',
      'buildCapsuleDockModel',
      'buildCapsuleDockSlots',
      'assignCapsuleToDockSlot',
    ]) {
      expect(barSource).toContain(required);
    }
  });

  it('renders disabled public affordances and authenticated builder actions without adding routes', () => {
    const barSource = readFileSync(askContextBarPath, 'utf8');
    const inlineBuilderSource = readFileSync(inlineBuilderPath, 'utf8');

    expect(barSource).toContain('data-testid="public-context-sign-in-affordance"');
    expect(barSource).toContain('/login?mode=signup&redirect=%2Fapp');
    expect(barSource).toContain('/app/capsules?lane=repository');
    expect(barSource).not.toContain('/app/context-bar');
    expect(barSource).not.toContain('/app/ask-context');

    expect(inlineBuilderSource).toContain('data-testid="ask-inline-context-builder"');
    expect(inlineBuilderSource).toContain('createQuickContextFromDomain');
    expect(inlineBuilderSource).toContain('User');
    expect(inlineBuilderSource).toContain('Situation');
    expect(inlineBuilderSource).toContain('Tools');
    expect(inlineBuilderSource).toContain('Output');
    expect(inlineBuilderSource).toContain('Create and attach');
  });
});

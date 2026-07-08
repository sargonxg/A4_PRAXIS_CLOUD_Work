import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  assignCapsuleToDockSlot,
  clearCapsuleDockSlot,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import { persistCapsuleDockStack } from '@/hooks/use-capsule-dock-actions';

describe('Boardroom capsule dock picker', () => {
  const boardroomSource = readFileSync(
    join(process.cwd(), 'src/components/boardroom/boardroom-workspace.tsx'),
    'utf8',
  );

  it('renders inline picker affordances for every boardroom dock slot', () => {
    expect(boardroomSource).toContain('CapsuleListPicker');
    expect(boardroomSource).toContain('pickerSlot');
    expect(boardroomSource).toContain('data-testid={`boardroom-dock-slot-${slot.role}`}');
    expect(boardroomSource).toContain('data-testid={`boardroom-dock-change-${slot.role}`}');
    expect(boardroomSource).toContain('data-testid={`boardroom-dock-clear-${slot.role}`}');
    expect(boardroomSource).toContain('slotKind={pickerSlot}');
  });

  it('assigns a capsule through the shared dock persistence helper', async () => {
    const initial = defaultActiveContextStack();
    const next = assignCapsuleToDockSlot(initial, 'situation', { capsuleId: 'capsule-situation' });
    const saveStack = vi.fn(async (patch: Partial<ActiveContextStackState>) => sanitizeActiveContextStack({
      ...initial,
      ...patch,
    }));

    const saved = await persistCapsuleDockStack(saveStack, next);

    expect(saveStack).toHaveBeenCalledWith({
      stackId: 'capsule-situation',
      capsuleId: 'capsule-situation',
      capsuleRefs: [
        expect.objectContaining({
          capsuleId: 'capsule-situation',
          role: 'situation',
          primary: true,
        }),
      ],
    });
    expect(saved.capsuleId).toBe('capsule-situation');
    expect(saved.capsuleRefs[0]?.role).toBe('situation');
  });

  it('clears a slot through the same persistence helper', async () => {
    const withSituation = assignCapsuleToDockSlot(defaultActiveContextStack(), 'situation', {
      capsuleId: 'capsule-situation',
    });
    const withTool = assignCapsuleToDockSlot(withSituation, 'tool', { capsuleId: 'capsule-tool' });
    const cleared = clearCapsuleDockSlot(withTool, 'tool');
    const saveStack = vi.fn(async (patch: Partial<ActiveContextStackState>) => sanitizeActiveContextStack({
      ...withTool,
      ...patch,
    }));

    const saved = await persistCapsuleDockStack(saveStack, cleared);

    expect(saveStack).toHaveBeenCalledWith({
      stackId: 'capsule-situation',
      capsuleId: 'capsule-situation',
      capsuleRefs: [
        expect.objectContaining({
          capsuleId: 'capsule-situation',
          role: 'situation',
          primary: true,
        }),
      ],
    });
    expect(saved.capsuleRefs).toHaveLength(1);
    expect(saved.capsuleRefs.some((ref) => ref.capsuleId === 'capsule-tool')).toBe(false);
  });
});

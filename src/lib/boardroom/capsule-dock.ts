import { z } from 'zod';
import {
  CAPSULE_DOCK_SLOT_KINDS,
  buildCapsuleDockSlots,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveCapsuleRefInput,
  type ActiveContextStackState,
  type CapsuleDockSlotKind,
} from '@/lib/context/active-context-stack';

const BOARDROOM_DOCK_ROLES = ['user', 'situation', 'tool', 'output'] as const;

export const BoardroomCapsuleDockSlotPayloadSchema = z.object({
  role: z.enum(BOARDROOM_DOCK_ROLES),
  capsuleId: z.string().trim().min(1).max(240).nullable(),
  label: z.string().trim().min(1).max(240).nullable().default(null),
  version: z.number().int().positive().nullable().default(null),
});

export const BoardroomCapsuleDockPayloadSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  stackId: z.string().trim().min(1).max(240).nullable().default(null),
  slots: z.array(BoardroomCapsuleDockSlotPayloadSchema).max(4).default([]),
});

export type BoardroomCapsuleDockSlotPayload = z.infer<typeof BoardroomCapsuleDockSlotPayloadSchema>;
export type BoardroomCapsuleDockPayload = z.infer<typeof BoardroomCapsuleDockPayloadSchema>;

export function buildBoardroomCapsuleDockPayloadFromStack(stack: ActiveContextStackState): BoardroomCapsuleDockPayload {
  const dockSlots = buildCapsuleDockSlots(stack);
  return normalizeBoardroomCapsuleDockPayload({
    schemaVersion: 1,
    stackId: stack.stackId,
    slots: dockSlots.slots.map((slot) => ({
      role: slot.kind,
      capsuleId: slot.item?.capsuleId ?? null,
      label: slot.item?.label ?? null,
      version: versionNumberFromLabel(slot.item?.versionLabel),
    })),
  });
}

export function normalizeBoardroomCapsuleDockPayload(input: unknown): BoardroomCapsuleDockPayload {
  const parsed = BoardroomCapsuleDockPayloadSchema.safeParse(input);
  const value = parsed.success ? parsed.data : { schemaVersion: 1 as const, stackId: null, slots: [] };
  const byRole = new Map<CapsuleDockSlotKind, BoardroomCapsuleDockSlotPayload>();
  for (const slot of value.slots) {
    if (!isDockRole(slot.role) || byRole.has(slot.role)) continue;
    byRole.set(slot.role, {
      role: slot.role,
      capsuleId: slot.capsuleId,
      label: slot.label,
      version: slot.version,
    });
  }

  return {
    schemaVersion: 1,
    stackId: value.stackId,
    slots: CAPSULE_DOCK_SLOT_KINDS.map((role) => (
      byRole.get(role) ?? { role, capsuleId: null, label: null, version: null }
    )),
  };
}

export function activeContextStackFromBoardroomDockPayload(
  payload: BoardroomCapsuleDockPayload,
  fallback?: unknown,
): ActiveContextStackState {
  const base = fallback
    ? sanitizeActiveContextStack(fallback)
    : defaultActiveContextStack();
  const capsuleRefs: ActiveCapsuleRefInput[] = payload.slots.flatMap((slot, order) => {
    if (!slot.capsuleId) return [];
    return [{
      capsuleId: slot.capsuleId,
      label: slot.label,
      role: slot.role,
      primary: slot.role === 'situation',
      order,
      version: slot.version,
    }];
  });
  const situationCapsule = payload.slots.find((slot) => slot.role === 'situation' && slot.capsuleId)?.capsuleId ?? null;
  return sanitizeActiveContextStack({
    ...base,
    stackId: payload.stackId ?? base.stackId,
    capsuleId: situationCapsule ?? base.capsuleId,
    capsuleRefs,
  });
}

function versionNumberFromLabel(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const version = Number(match[0]);
  return Number.isInteger(version) && version > 0 ? version : null;
}

function isDockRole(value: string): value is CapsuleDockSlotKind {
  return (CAPSULE_DOCK_SLOT_KINDS as readonly string[]).includes(value);
}

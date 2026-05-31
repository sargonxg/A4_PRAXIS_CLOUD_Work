import {
  AGENT_REGISTRY,
  type AgentPersona,
  type AgentPersonaId,
} from '@/lib/agents/registry';

export const BOARDROOM_DEFAULT_PARTICIPANT_IDS = [
  'synthesis-chair',
  'mediator',
  'legal',
  'security',
  'humanitarian',
  'media',
  'red-team',
] as const;

export const BOARDROOM_PARTICIPANT_IDS = [
  'synthesis-chair',
  'source-scout',
  'mediator',
  'legal',
  'security',
  'humanitarian',
  'media',
  'red-team',
] as const;

export type BoardroomParticipantId = (typeof BOARDROOM_PARTICIPANT_IDS)[number];

export type BoardroomParticipantRole = 'chair' | 'analyst' | 'reviewer' | 'red-teamer' | 'stakeholder';

export type BoardroomParticipant = {
  id: BoardroomParticipantId;
  label: string;
  lens: string;
  role: BoardroomParticipantRole;
  rolePrompt: string;
  critic: boolean;
};

export const BOARDROOM_PARTICIPANTS: Record<BoardroomParticipantId, BoardroomParticipant> =
  Object.fromEntries(BOARDROOM_PARTICIPANT_IDS.map((id) => {
    const persona = AGENT_REGISTRY[id as AgentPersonaId];
    return [id, personaToBoardroomParticipant(persona)];
  })) as Record<BoardroomParticipantId, BoardroomParticipant>;

export function boardroomParticipantLabel(id: BoardroomParticipantId): string {
  return BOARDROOM_PARTICIPANTS[id].label;
}

export function isBoardroomParticipantId(value: string): value is BoardroomParticipantId {
  return (BOARDROOM_PARTICIPANT_IDS as readonly string[]).includes(value);
}

function personaToBoardroomParticipant(persona: AgentPersona): BoardroomParticipant {
  return {
    id: persona.id as BoardroomParticipantId,
    label: persona.label,
    lens: lensForPersona(persona),
    role: roleForPersona(persona),
    rolePrompt: persona.rolePrompt,
    critic: Boolean(persona.critic),
  };
}

function lensForPersona(persona: AgentPersona): string {
  switch (persona.id) {
    case 'synthesis-chair':
      return 'Chair';
    case 'red-team':
      return 'Adversarial review';
    case 'source-scout':
      return 'Evidence discovery';
    default:
      return persona.label.replace(/\s+Analyst$/, '').replace(/\s+Lead$/, '');
  }
}

function roleForPersona(persona: AgentPersona): BoardroomParticipantRole {
  switch (persona.id) {
    case 'synthesis-chair':
      return 'chair';
    case 'red-team':
      return 'red-teamer';
    case 'source-scout':
      return 'analyst';
    case 'mediator':
    case 'humanitarian':
      return 'stakeholder';
    default:
      return 'reviewer';
  }
}

import { DEFAULT_BOARDROOM_PERSONAS, resolveBoardroomPersonas } from '@/lib/boardroom/personas';
import {
  DeliberationArtifactSchema,
  DeliberationConfigSchema,
  type Citation,
  type DeliberationArtifact,
  type DeliberationConfig,
  type DeliberationSynthesis,
  type PersonaContribution,
  type PersonaSpec,
} from '@/types/boardroom';

const COST_CEILING_USD = 1.5;
const COST_PER_CONTRIBUTION_USD = 0.035;

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function citationFor(persona: PersonaSpec, kind: Citation['sourceType'] = 'corpus'): Citation {
  const source = persona.corpus.manifest[0];
  return {
    id: `${persona.id}-${source.id}`,
    label: source.title,
    sourceType: kind,
    sourceRef: source.id,
    excerpt: source.citation,
  };
}

function contribution(input: {
  id: string;
  persona: PersonaSpec;
  phase: PersonaContribution['phase'];
  contributionType: PersonaContribution['contributionType'];
  text: string;
  createdAt: string;
  citations?: Citation[];
  toolId?: string;
}): PersonaContribution {
  return {
    id: input.id,
    personaId: input.persona.id,
    personaName: input.persona.displayName,
    phase: input.phase,
    contributionType: input.contributionType,
    text: input.text,
    citations: input.citations ?? [citationFor(input.persona)],
    toolUses: input.toolId
      ? [{
        toolId: input.toolId,
        label: `${input.persona.shortRole} checked ${input.toolId}`,
        status: 'completed',
        summary: 'Foundation run records the tool handoff contract; live model-backed tool execution remains a Pack 16 deployment follow-up.',
      }]
      : [],
    wordCount: words(input.text),
    confidence: 0.6,
    synthesized: true,
    createdAt: input.createdAt,
  };
}

function contributionText(persona: PersonaSpec, question: string, index: number): string {
  const lead = persona.voice.signaturePhrases[0];
  const coreQuestion = persona.expertise.signatureQuestions[index % persona.expertise.signatureQuestions.length];
  const framework = persona.expertise.frameworks[0];
  return `${lead}, I would test "${question}" through ${framework.name}. My main intervention is ${coreQuestion.toLowerCase()} Until the case graph or corpus gives us firmer receipts, I would treat this as a synthesized judgment, not a verdict-layer finding. The defensible move is to name the uncertainty, preserve the dissent, and ask what evidence would change the room's confidence.`;
}

function synthesize(config: DeliberationConfig, participants: PersonaSpec[], contributions: PersonaContribution[]): DeliberationSynthesis {
  const lead = participants.find((persona) => persona.id === 'synthesis-lead') ?? participants[participants.length - 1];
  return {
    bluf: `The boardroom would proceed cautiously on "${config.question}", carrying the strongest disagreement with the recommendation rather than flattening it.`,
    consensusClaims: [
      {
        id: 'consensus-1',
        text: 'The recommendation should be treated as advisory and source-conditioned until the analyst promotes any claim through review.',
        confidence: 0.6,
        citations: [citationFor(lead, 'opinion'), contributions[0]?.citations[0] ?? citationFor(lead)],
        synthesized: true,
      },
      {
        id: 'consensus-2',
        text: 'The next user-visible artifact should preserve consensus, dissent, open questions, and named evidence gaps.',
        confidence: 0.55,
        citations: [citationFor(lead)],
        synthesized: true,
      },
    ],
    dissentingViews: contributions
      .filter((item) => item.contributionType === 'challenge')
      .map((item) => item.text)
      .slice(0, 3),
    unresolvedQuestions: participants.slice(0, 3).map((persona) => persona.expertise.signatureQuestions[0]),
    recommendedActions: [
      'Run a source-receipt pass before exporting the synthesis.',
      'Promote only selected claims through the graph review queue.',
      config.satIntegration.achScoring ? 'Open the linked ACH matrix and score the strongest disagreement.' : 'Use ACH if the disagreement turns on competing explanations.',
    ],
    confidence: 0.6,
    synthesized: true,
  };
}

export function buildBoardroomDeliberation(input: {
  id: string;
  caseId: string;
  ownerUid: string;
  config: Partial<DeliberationConfig> & { question: string };
  now?: string;
}): DeliberationArtifact {
  const now = input.now ?? new Date().toISOString();
  const config = DeliberationConfigSchema.parse({
    rounds: 4,
    moderatorStyle: 'standard',
    participantIds: DEFAULT_BOARDROOM_PERSONAS,
    satIntegration: {},
    ...input.config,
  });
  const participants = resolveBoardroomPersonas(config.participantIds);
  const activeParticipants = participants.length >= 3
    ? participants
    : resolveBoardroomPersonas(DEFAULT_BOARDROOM_PERSONAS);

  const openingModerator = activeParticipants.find((persona) => persona.id === 'synthesis-lead') ?? activeParticipants[0];
  const contributions: PersonaContribution[] = [
    contribution({
      id: 'turn-open',
      persona: openingModerator,
      phase: 'opening',
      contributionType: 'opening',
      text: `We are convening a structured boardroom on "${config.question}". I will keep the moderator role procedural: define the question, call the right voices, surface disagreement, and keep synthesis claims advisory until reviewed.`,
      createdAt: now,
      citations: [citationFor(openingModerator, 'opinion')],
    }),
    ...activeParticipants
      .filter((persona) => persona.id !== 'synthesis-lead')
      .slice(0, 6)
      .map((persona, index) => contribution({
        id: `turn-${index + 1}`,
        persona,
        phase: index < 4 ? 'initial_takes' : 'disagreement',
        contributionType: persona.id === 'devils-advocate' ? 'challenge' : 'initial_take',
        text: contributionText(persona, config.question, index),
        createdAt: now,
        toolId: persona.tools.proficientToolIds[0],
      })),
  ];

  if (config.satIntegration.redTeamRound && !contributions.some((item) => item.personaId === 'devils-advocate')) {
    const critic = activeParticipants.find((persona) => persona.id === 'devils-advocate');
    if (critic) {
      contributions.push(contribution({
        id: 'turn-red-team',
        persona: critic,
        phase: 'red_team_challenge',
        contributionType: 'challenge',
        text: `I'd push back on the room's emerging consensus. The strongest failure mode is premature convergence: the boardroom may be treating sparse evidence as a stable pattern. I would ask what would make us wrong before drafting upward.`,
        createdAt: now,
        toolId: 'cross.red-team',
      }));
    }
  }

  const synthesis = synthesize(config, activeParticipants, contributions);
  const estimatedUsd = Number(Math.min(COST_CEILING_USD, contributions.length * COST_PER_CONTRIBUTION_USD).toFixed(3));

  return DeliberationArtifactSchema.parse({
    id: input.id,
    caseId: input.caseId,
    ownerUid: input.ownerUid,
    title: `Boardroom - ${config.question.slice(0, 72)}`,
    status: 'synthesized',
    phase: 'synthesis',
    config,
    participants: activeParticipants,
    contributions,
    synthesis,
    cost: {
      ceilingUsd: COST_CEILING_USD,
      estimatedUsd,
      ceilingReached: estimatedUsd >= COST_CEILING_USD,
    },
    createdAt: now,
    updatedAt: now,
  });
}

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CANONICAL_PERSONAS, DEFAULT_BOARDROOM_PERSONAS } from '../src/lib/boardroom/personas';
import { buildBoardroomDeliberation } from '../src/lib/boardroom/deterministic-boardroom';
import { DeliberationArtifactSchema, PersonaSpecSchema } from '../src/types/boardroom';

const requiredFiles = [
  'src/types/boardroom.ts',
  'backend/types/boardroom.py',
  'src/lib/boardroom/personas.ts',
  'src/lib/boardroom/deterministic-boardroom.ts',
  'src/lib/boardroom/export.ts',
  'src/lib/boardroom/custom-personas-store.ts',
  'src/lib/boardroom/store.ts',
  'src/app/api/boardroom/personas/route.ts',
  'src/app/api/boardroom/personas/[personaId]/route.ts',
  'src/app/api/boardroom/deliberations/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/start/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/abort/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/stream/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/export/route.ts',
  'src/app/api/boardroom/deliberations/[deliberationId]/synthesis/promote/route.ts',
  'src/app/app/workbench/[caseId]/boardroom/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/new/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/[deliberationId]/page.tsx',
  'src/app/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis/page.tsx',
  'src/components/boardroom/RoundTable.tsx',
  'src/components/boardroom/SpeechBubble.tsx',
  'src/components/boardroom/CitationPill.tsx',
  'src/components/boardroom/ToolUseIndicator.tsx',
  'src/components/boardroom/ModeratorChyron.tsx',
  'src/components/boardroom/TranscriptPane.tsx',
  'src/components/boardroom/PlaybackControls.tsx',
  'src/components/boardroom/PersonaAvatar.tsx',
  'src/app/app/settings/personas/page.tsx',
  'src/app/app/settings/personas/new/page.tsx',
  'src/app/app/settings/personas/[personaId]/page.tsx',
  'src/components/personas/PersonaSpecForm.tsx',
  'src/components/personas/CorpusUploader.tsx',
  'src/components/personas/VoiceProfileEditor.tsx',
  'src/components/personas/TestDeliberation.tsx',
  'backend/routers/custom_personas.py',
  'backend/services/custom_personas/spec_validator.py',
  'backend/services/custom_personas/system_prompt_generator.py',
  'backend/services/custom_personas/sandbox.py',
  'backend/services/persona_corpus/retriever.py',
  'backend/services/persona_corpus/ingester.py',
  'backend/agents/analyst_persona/runner.py',
  'backend/agents/moderator/runner.py',
  'skills/subagents/analyst_persona/SKILL.md',
  'skills/subagents/moderator/SKILL.md',
  'docs/codex-prompts/PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md',
  'tests/unit/lib/boardroom/export.test.ts',
  'tests/unit/lib/boardroom/custom-personas.test.ts',
  'tests/e2e/workbench/boardroom-flow.spec.ts',
  'tests/e2e/workbench/boardroom-abort-and-cost-guard.spec.ts',
  'tests/e2e/settings/custom-persona-creation.spec.ts',
];

const failures: string[] = [];
for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

if (CANONICAL_PERSONAS.length !== 10) failures.push(`expected 10 canonical personas, found ${CANONICAL_PERSONAS.length}`);
for (const persona of CANONICAL_PERSONAS) {
  const parsed = PersonaSpecSchema.safeParse(persona);
  if (!parsed.success) failures.push(`invalid persona ${persona.id}: ${parsed.error.message}`);
  if (persona.corpus.manifest.length < 3) failures.push(`persona ${persona.id} has too-thin corpus manifest`);
  if (persona.tools.proficientToolIds.length === 0) failures.push(`persona ${persona.id} has no tool affinity`);
}

const deliberation = buildBoardroomDeliberation({
  id: 'audit-boardroom',
  caseId: 'audit-case',
  ownerUid: 'audit-user',
  config: {
    question: 'What should the mission do next?',
    participantIds: DEFAULT_BOARDROOM_PERSONAS,
    satIntegration: { redTeamRound: true, achScoring: true, kacAnnex: false, premortemRound: false },
  },
});
const artifact = DeliberationArtifactSchema.safeParse(deliberation);
if (!artifact.success) failures.push(`invalid sample deliberation: ${artifact.error.message}`);
if (deliberation.cost.estimatedUsd > deliberation.cost.ceilingUsd) failures.push('sample deliberation exceeds cost ceiling');
if (!deliberation.contributions.every((turn) => turn.citations.length > 0 && turn.synthesized === true && turn.confidence <= 0.6)) {
  failures.push('sample deliberation has uncited or overconfident turns');
}

if (failures.length > 0) {
  console.error('Boardroom audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Boardroom audit passed for Pack 16 third pass: 10 personas, SSE stream route, lifecycle controls, DOCX/Markdown export, review-queue promotion, custom-persona scaffolds, persona-corpus fallback, UI, e2e coverage, subagent scaffolds, and citable synthesized sample deliberation. (static-marker)');

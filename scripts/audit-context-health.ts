import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildContextHealthReport,
  MAX_CONTEXT_HEALTH_NEXT_ACTIONS,
  type ContextHealthInput,
} from '../src/lib/context/context-health';

const root = process.cwd();
const failures: string[] = [];
const sourcePath = 'src/lib/context/context-health.ts';
const source = read(sourcePath);

if (!source.includes('export const MAX_CONTEXT_HEALTH_NEXT_ACTIONS = 3')) {
  failures.push(`${sourcePath} must export MAX_CONTEXT_HEALTH_NEXT_ACTIONS = 3`);
}

if (!source.includes('.slice(0, MAX_CONTEXT_HEALTH_NEXT_ACTIONS)')) {
  failures.push(`${sourcePath} must slice visible next actions by MAX_CONTEXT_HEALTH_NEXT_ACTIONS`);
}

if (/from ['"]@\/lib\/ai|from ['"]@\/lib\/intelligence|from ['"]@\/lib\/firebase|streamText|getModel|searchSituationCorpus/.test(source)) {
  failures.push(`${sourcePath} must keep context health deterministic; no AI, Firebase, or corpus-search dependencies`);
}

const expectedActionOrder = [
  'attach-user-core',
  'attach-situation-core',
  'attach-sources',
  'map-actors',
  'repair-timeline',
  'review-gaps',
  'draft-memo',
  'ask-context',
];
const actionOrder = [...source.matchAll(/id:\s*'([^']+)'/g)]
  .map((match) => match[1])
  .filter((id) => expectedActionOrder.includes(id));

if (actionOrder.join('|') !== expectedActionOrder.join('|')) {
  failures.push(`${sourcePath} changed deterministic next-action order; update audit-context-health.ts if intended`);
}

const scenarios: Array<{ name: string; input: ContextHealthInput; expected: string[] }> = [
  {
    name: 'empty context prioritizes core setup before work',
    input: {
      hasUserCore: false,
      hasSituationCore: false,
      sourceCount: 0,
      actorCount: 0,
      hasTimeline: false,
      evidenceGapCount: 5,
      hasDraft: false,
    },
    expected: ['attach-user-core', 'attach-situation-core', 'attach-sources'],
  },
  {
    name: 'working context shows the three smallest deterministic repairs',
    input: {
      hasUserCore: true,
      hasSituationCore: true,
      sourceCount: 0,
      actorCount: 0,
      hasTimeline: false,
      evidenceGapCount: 5,
      hasDraft: false,
    },
    expected: ['attach-sources', 'map-actors', 'repair-timeline'],
  },
  {
    name: 'grounded context only invites Ask',
    input: {
      hasUserCore: true,
      hasSituationCore: true,
      sourceCount: 4,
      documentCount: 1,
      actorCount: 4,
      hasTimeline: true,
      evidenceGapCount: 0,
      hasDraft: true,
    },
    expected: ['ask-context'],
  },
];

for (const scenario of scenarios) {
  const report = buildContextHealthReport(scenario.input);
  const ids = report.nextActions.map((action) => action.id);
  if (ids.length > MAX_CONTEXT_HEALTH_NEXT_ACTIONS) {
    failures.push(`${scenario.name}: exposed ${ids.length} next actions`);
  }
  if (ids.join('|') !== scenario.expected.join('|')) {
    failures.push(`${scenario.name}: expected ${scenario.expected.join(', ')}, got ${ids.join(', ')}`);
  }
}

for (const input of enumerateInputs()) {
  const report = buildContextHealthReport(input);
  if (report.nextActions.length > MAX_CONTEXT_HEALTH_NEXT_ACTIONS) {
    failures.push(`combinatorial check exposed ${report.nextActions.length} next actions for ${JSON.stringify(input)}`);
    break;
  }
}

if (failures.length > 0) {
  console.error('audit:context-health failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:context-health OK (deterministic rules first, max 3 visible next actions)');

function enumerateInputs(): ContextHealthInput[] {
  const inputs: ContextHealthInput[] = [];
  for (const hasUserCore of [false, true]) {
    for (const hasSituationCore of [false, true]) {
      for (const sourceCount of [0, 1, 3, 4]) {
        for (const documentCount of [0, 1]) {
          for (const actorCount of [0, 1, 3]) {
            for (const hasTimeline of [false, true]) {
              for (const evidenceGapCount of [0, 1, 4]) {
                for (const hasDraft of [false, true]) {
                  inputs.push({
                    hasUserCore,
                    hasSituationCore,
                    sourceCount,
                    documentCount,
                    actorCount,
                    hasTimeline,
                    evidenceGapCount,
                    hasDraft,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  return inputs;
}

function read(rel: string): string {
  const full = join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

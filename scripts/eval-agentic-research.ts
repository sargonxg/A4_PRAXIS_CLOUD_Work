import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AGENTIC_RESEARCH_EVAL_SCENARIOS,
  buildDefaultAgenticResearchEvalRun,
  summarizeAgenticResearchEval,
} from '@/lib/agent-runtime/research-eval';

type EvalPayload = {
  generatedAt: string;
  mode: string;
  scenarios: typeof AGENTIC_RESEARCH_EVAL_SCENARIOS;
  comparisons: ReturnType<typeof buildDefaultAgenticResearchEvalRun>;
  scorecard: ReturnType<typeof summarizeAgenticResearchEval>;
  summary: {
    scenarioCount: number;
    praxisWins: number;
    capsuleVsGenericDelta: number;
    note: string;
  };
};

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const outDir = join(process.cwd(), 'docs', 'audits', 'agentic-research-evals');
  await mkdir(outDir, { recursive: true });

  const comparisons = buildDefaultAgenticResearchEvalRun();
  const scorecard = summarizeAgenticResearchEval(comparisons);
  const payload = {
    generatedAt: new Date().toISOString(),
    mode: 'deterministic-contract-eval',
    scenarios: AGENTIC_RESEARCH_EVAL_SCENARIOS,
    comparisons,
    scorecard,
    summary: {
      scenarioCount: scorecard.scenarioCount,
      praxisWins: scorecard.praxisWins,
      capsuleVsGenericDelta: scorecard.capsuleVsGenericDelta,
      note: 'This harness verifies PRAXIS product-proof dimensions against a prompt-only baseline. Live answer grading can attach observed artifacts later.',
    },
  };

  const jsonPath = join(outDir, `${today}-praxis-vs-generic-llm.json`);
  const mdPath = join(outDir, `${today}-praxis-vs-generic-llm.md`);
  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(mdPath, renderMarkdown(payload), 'utf8');

  const failed = comparisons.filter((comparison) => !comparison.praxisWins);
  console.log(`[eval:agentic-research] wrote ${jsonPath}`);
  console.log(`[eval:agentic-research] wrote ${mdPath}`);
  console.log(`[eval:agentic-research] ${comparisons.length - failed.length}/${comparisons.length} scenarios beat the prompt-only baseline`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

function renderMarkdown(payload: EvalPayload): string {
  const rows = payload.comparisons.map((comparison) => [
    comparison.scenarioId,
    String(comparison.praxis.total),
    String(comparison.baseline.total),
    String(comparison.delta),
    comparison.praxisWins ? 'yes' : 'no',
    comparison.praxis.failureMode ?? 'none',
  ]);
  return [
    '# PRAXIS Agentic Research Eval',
    '',
    `Generated: ${payload.generatedAt}`,
    `Mode: ${payload.mode}`,
    `Capsule-vs-generic delta: ${payload.scorecard.capsuleVsGenericDelta}`,
    '',
    '| Scenario | PRAXIS | Baseline | Delta | Proof win | Failure mode |',
    '|---|---:|---:|---:|---|---|',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    '',
    '## Fixed Scenarios',
    '',
    ...payload.scenarios.map((scenario) => `- ${scenario.id}: ${scenario.title}`),
    '',
    '## Notes',
    '',
    '- Scores are deterministic contract checks for planning, source authority, recency, citation fidelity, uncertainty handling, capsule reuse, persistence, audit trail, latency, and failure mode.',
    '- No secrets or user content are written by this eval harness.',
    '',
  ].join('\n');
}

main().catch((err) => {
  console.error('[eval:agentic-research] failed', err);
  process.exit(1);
});

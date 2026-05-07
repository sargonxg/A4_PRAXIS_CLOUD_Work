import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

function title(toolId: string) {
  return toolId.split('.').map((part) => part.replaceAll('-', ' ')).join(' / ');
}

function renderSkill(toolId: string) {
  const tool = MARKETPLACE_TOOLS.find((candidate) => candidate.id === toolId);
  if (!tool) throw new Error(`Unknown tool ${toolId}`);
  const chainInto = tool.composition.canChainInto.length > 0 ? tool.composition.canChainInto.join(', ') : 'No default downstream chain.';
  const chainFrom = tool.composition.canChainFrom.length > 0 ? `Can follow ${tool.composition.canChainFrom.join(', ')}.` : 'Can start from the active case context.';

  return `# ${tool.name}

## Purpose
${tool.description}

## When To Use
Use when the active situation needs ${tool.rationale ?? `the ${title(tool.id)} workflow`} and the user wants a structured, reviewable marketplace run.

## When Not To Use
Do not use when the case lacks any relevant actors, claims, events, or source receipts. Run context preparation or ingestion first when the user needs grounded assertions.

## Inputs
Analyst prompt, active case context, ontology requirements (${tool.ontologyRequirements.join(', ')}), source receipts, graph snippets, and optional focused node or prior tool output.

## Outputs
Structured summary, evidence-grounded findings, synthesized options where appropriate, confidence and gap notes, next actions, and a preserved context dump.

## Context Requirements
Requires user role/preferences, workspace methodology when available, active case graph context, conversation focus, and graceful handling for weak context. Minimum context health target: ${Math.round(tool.minContextHealth * 100)}%.

## Composition
${chainFrom} Can chain into: ${chainInto}

## Examples
Run ${tool.name} against the active case and export accepted findings to the workbench evidence drawer or Memo Studio.

## Pitfalls
Do not turn synthesized output into durable graph assertions without review. Keep missing receipts, ontology mismatch, and low confidence visible as advisories.
`;
}

const missingOnly = process.argv.includes('--missing');
let written = 0;

for (const tool of MARKETPLACE_TOOLS) {
  const file = join(process.cwd(), tool.skill.file);
  if (missingOnly && existsSync(file)) continue;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderSkill(tool.id), 'utf8');
  written += 1;
}

console.log(`Wrote ${written} marketplace skill files.`);

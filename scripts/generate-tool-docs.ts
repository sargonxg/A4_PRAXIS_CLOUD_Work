#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates one maintainable specification page per registered PRAXIS tool.
 *
 * Run: npm run generate:tool-docs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { TOOL_REGISTRY } = require('../src/lib/constants/tool-registry.ts') as typeof import('../src/lib/constants/tool-registry');
const { getToolOperatingContract } = require('../src/lib/tools/tool-operating-contracts.ts') as typeof import('../src/lib/tools/tool-operating-contracts');
const { getToolContextBlueprint } = require('../src/lib/tools/tool-context-blueprints.ts') as typeof import('../src/lib/tools/tool-context-blueprints');
const { getToolPathMembership } = require('../src/lib/tools/tool-path-taxonomy.ts') as typeof import('../src/lib/tools/tool-path-taxonomy');

function bullet(items: readonly string[], fallback = 'None declared.'): string[] {
  return items.length ? items.map((item) => `- ${item}`) : [`- ${fallback}`];
}

function task(items: readonly string[]): string[] {
  return items.map((item) => `- [ ] ${item}`);
}

function renderToolDoc(tool: (typeof TOOL_REGISTRY)[number]): string {
  const contract = getToolOperatingContract(tool.id);
  const blueprint = getToolContextBlueprint(tool.id);
  const memberships = getToolPathMembership(tool.id);
  const active = blueprint.activePathFocus ? 'Yes - active generic/conflict-political sprint focus.' : 'No - documented for later path activation.';

  return [
    `# ${tool.name}`,
    '',
    `Tool id: \`${tool.id}\``,
    '',
    '## Product Role',
    '',
    contract.objective,
    '',
    contract.userValue,
    '',
    `- Category: \`${tool.category}\``,
    `- AI route: \`${tool.aiRoute}\``,
    `- Data schema: \`${tool.dataSchema}\``,
    `- Output type: \`${tool.outputType}\``,
    `- Model tier: \`${tool.modelTier ?? 'provider-default'}\``,
    `- Active path focus: ${active}`,
    '',
    '## Workflow Paths',
    '',
    ...bullet(memberships.map((membership) => `${membership.label} / ${membership.tier} / ${membership.stage}`), 'No path membership yet.'),
    '',
    '## Required Context',
    '',
    ...bullet(blueprint.requiredLayers.map((layer) => `\`${layer}\``)),
    '',
    '## Optional Context',
    '',
    ...bullet(blueprint.optionalLayers.map((layer) => `\`${layer}\``)),
    '',
    '## Situation Inputs',
    '',
    ...bullet(blueprint.requiredSituationFields.map((field) => `\`${field}\``)),
    '',
    '## Required Questions',
    '',
    ...bullet(blueprint.requiredClarifications),
    '',
    '## Expected Outputs',
    '',
    ...bullet(contract.expectedOutputs.map((output) => `${output.label} (${output.kind}) - ${output.description}`)),
    '',
    '## Methods And Sources',
    '',
    'Frameworks:',
    ...bullet(tool.frameworks),
    '',
    'Primary evidence policy:',
    ...bullet(blueprint.evidencePolicy.primarySources),
    '',
    'Degraded state triggers:',
    ...bullet(blueprint.evidencePolicy.degradedWhenMissing),
    '',
    '## Database Contract',
    '',
    `- Canonical output: \`${blueprint.database.canonicalOutputPath}\``,
    `- Version history: \`${blueprint.database.versionHistoryPath}\``,
    `- Legacy compatibility: \`${blueprint.database.legacyCompatibilityPath}\``,
    `- Graph proposals: \`${blueprint.database.graphProposalPath}\``,
    `- Sources: \`${blueprint.database.sourceCorpusPath}\``,
    `- Document chunks: \`${blueprint.database.documentChunkPath}\``,
    `- Audit trail: \`${blueprint.database.auditTrailPath}\``,
    '',
    '## Graph Backbone',
    '',
    `- Current mode: \`${blueprint.graphBackbone.currentMode}\``,
    `- Future Dialectica role: ${blueprint.graphBackbone.futureDialecticaRole}`,
    '',
    '## Document Production',
    '',
    `- LibreOffice export lane: ${blueprint.documentProduction.supportsLibreOfficeExport ? 'yes' : 'no'}`,
    ...bullet(blueprint.documentProduction.artifactTypes, 'Not a primary document-production tool.'),
    ...bullet(blueprint.documentProduction.exportNotes),
    '',
    '## Ask PRAXIS Actions',
    '',
    ...bullet(contract.askPraxisActions),
    '',
    '## Quality Bar',
    '',
    ...bullet(contract.qualityBar),
    '',
    '## Next Implementation Tasks',
    '',
    ...task([
      'Verify the page shows the operating contract, context blueprint, confidence, provenance, and degraded state.',
      'Verify the route accepts active situation context and returns schema-valid, non-empty output.',
      'Verify saved output reloads from canonical tool-data and can be exported or reused by Ask PRAXIS.',
      'Add or update browser smoke coverage for a realistic first-time and power-user flow.',
    ]),
    '',
    '## Regeneration',
    '',
    'This file is generated from the registry, operating contract, path taxonomy, and context blueprint. Run `npm run generate:tool-docs` after changing those sources.',
    '',
  ].join('\n');
}

function renderIndex(): string {
  const lines = [
    '# Generated PRAXIS Tool Specifications',
    '',
    'This directory is generated from live PRAXIS code. It gives every registered tool a stable product, context, database, graph, document-production, and verification contract.',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| Tool | Category | Active path focus | AI route |',
    '|---|---:|---:|---|',
  ];
  for (const tool of TOOL_REGISTRY) {
    const blueprint = getToolContextBlueprint(tool.id);
    lines.push(`| [${tool.name}](./${tool.id}.md) | ${tool.category} | ${blueprint.activePathFocus ? 'yes' : 'no'} | \`${tool.aiRoute}\` |`);
  }
  lines.push('', 'Regenerate with `npm run generate:tool-docs`.', '');
  return lines.join('\n');
}

function main() {
  const outDir = join(process.cwd(), 'docs', 'tools', 'generated');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  for (const tool of TOOL_REGISTRY) {
    writeFileSync(join(outDir, `${tool.id}.md`), renderToolDoc(tool));
  }
  writeFileSync(join(outDir, 'INDEX.md'), renderIndex());
  console.log(`Wrote ${TOOL_REGISTRY.length} tool specs to ${outDir}`);
}

main();

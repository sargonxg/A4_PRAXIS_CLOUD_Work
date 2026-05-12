import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRAXIS_CANONICAL_TOOLS } from '../src/lib/tools/canonical';
import { coreLabel } from '../src/lib/tools/contract';

const docsDir = join(process.cwd(), 'docs', 'tools');
mkdirSync(docsDir, { recursive: true });

const contract = `# PRAXIS Attachable Tool Contract

PRAXIS tools are not a marketplace list. They are attachable work modules bound to the active Core stack.

## Core Kinds

- User Core: who is asking, role, voice, preferences, institution, and decision posture.
- Situation Core: what the user is working on, actors, geography, graph, assumptions, and stage.
- Time Core: deadlines, event sequence, freshness, monitoring cadence, and horizon.
- Office Core: team, mandate, audience, institution, and clearance posture.
- Source Graph: trusted sources, documents, receipts, claims, evidence, and confidence.
- Output Core: target work product, template, citation style, audience, and export constraints.

## Output Kinds

- text: an inline answer or passage.
- structured: schema-shaped tool data saved under the situation.
- graph_delta: a proposed graph mutation that requires review.
- work_product: a memo, briefing, handover, or exportable document.

## Render Targets

- inline: appears under Ask PRAXIS.
- workbench: appears as a case workspace panel or saved tool output.
- writer: appears in PraxisWriter with provenance and citations.

## Rule

Every canonical tool must declare required cores, output kind, API route, render target, methodology, frameworks, limits, and model tier.
`;

const canonical = [
  '# PRAXIS Canonical Tool Library',
  '',
  'The default PRAXIS surface is twelve attachable tools. Ask PRAXIS recommends three based on the active Core stack.',
  '',
  ...PRAXIS_CANONICAL_TOOLS.flatMap((tool, index) => [
    `## ${index + 1}. ${tool.name}`,
    '',
    '### What it does',
    `${tool.name} produces ${tool.produces.replace('_', ' ')} output through ${tool.uiTarget}.`,
    '',
    '### Cores it needs',
    tool.requires.map((core) => `- ${coreLabel(core)}`).join('\n'),
    '',
    '### Output',
    `Produces ${tool.produces.replace('_', ' ')} via \`${tool.route}\`.`,
    '',
    '### Methodology',
    tool.methodology,
    '',
    '### Frameworks',
    tool.frameworks.map((framework) => `- ${framework}`).join('\n'),
    '',
    '### Limits',
    tool.limits,
    '',
  ]),
].join('\n');

writeFileSync(join(docsDir, 'CONTRACT.md'), contract);
writeFileSync(join(docsDir, 'CANONICAL.md'), canonical);

console.log(`Wrote ${join(docsDir, 'CONTRACT.md')}`);
console.log(`Wrote ${join(docsDir, 'CANONICAL.md')}`);

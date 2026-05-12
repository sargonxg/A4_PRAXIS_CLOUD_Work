import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getCanonicalToolLibrary, getCanonicalToolLibrarySummary } from '@/lib/tools/canonical-tool-library';

const OUT_DIR = join(process.cwd(), 'docs', 'tools');
const JSON_PATH = join(OUT_DIR, 'canonical-tool-library.json');
const MD_PATH = join(OUT_DIR, 'CANONICAL_TOOL_LIBRARY.md');

mkdirSync(OUT_DIR, { recursive: true });

const summary = getCanonicalToolLibrarySummary();
const entries = getCanonicalToolLibrary();

writeFileSync(
  JSON_PATH,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, entries }, null, 2)}\n`,
  'utf8',
);

const markdown = [
  '# Canonical PRAXIS Tool Library',
  '',
  'This document is generated from the code-backed tool registries. Do not hand-edit the tool inventory here; update the registry and rerun `npm run generate:canonical-tool-library`.',
  '',
  '## Summary',
  '',
  `- Total tools: ${summary.totalTools}`,
  `- Default visible tools: ${summary.visibleTools}`,
  `- Archived or specialist tools: ${summary.archiveTools}`,
  `- Tools with route/API wiring: ${summary.routedTools}`,
  '',
  '## Source Of Truth',
  '',
  ...summary.generatedFrom.map((source) => `- \`${source}\``),
  '',
  '## Tool Entries',
  '',
  ...entries.flatMap((entry) => [
    `### ${entry.name}`,
    '',
    `- ID: \`${entry.id}\``,
    `- Short label: ${entry.shortLabel}`,
    `- Surface: ${entry.surface}`,
    `- API route: \`${entry.route}\``,
    `- UI target: ${entry.uiTarget}`,
    `- Required cores: ${entry.requires.map((core) => `\`${core}\``).join(', ')}`,
    `- Output: ${entry.produces}`,
    `- Model tier: ${entry.modelTier}`,
    `- Credits: ${entry.credits}`,
    `- Frameworks: ${entry.frameworks.length ? entry.frameworks.join(', ') : 'none listed'}`,
    `- Limits: ${entry.limits}`,
    '',
    entry.methodology,
    '',
  ]),
].join('\n');

writeFileSync(MD_PATH, markdown, 'utf8');

console.log(`Wrote ${JSON_PATH}`);
console.log(`Wrote ${MD_PATH}`);

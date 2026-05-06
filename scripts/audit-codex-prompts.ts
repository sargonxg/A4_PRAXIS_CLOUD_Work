import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md',
  'docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md',
  'docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md',
];

const failures: string[] = [];
for (const file of required) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  if (!text.includes('PRAXIS') || text.length < 5000) failures.push(`${file} does not look like a complete pack prompt`);
}

if (failures.length > 0) {
  console.error('Codex prompt pack audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Codex prompt pack audit passed for packs 09-11.');

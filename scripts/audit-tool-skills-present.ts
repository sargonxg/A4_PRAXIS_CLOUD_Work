import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const failures: string[] = [];
const sections = ['Purpose', 'When To Use', 'When Not To Use', 'Inputs', 'Outputs', 'Context Requirements', 'Composition', 'Examples', 'Pitfalls'];

for (const tool of MARKETPLACE_TOOLS) {
  const file = join(process.cwd(), tool.skill.file);
  if (!existsSync(file)) {
    failures.push(`${tool.id} missing skill file`);
    continue;
  }
  const text = readFileSync(file, 'utf8');
  for (const section of sections) {
    if (!text.includes(`## ${section}`)) failures.push(`${tool.id} skill missing ${section}`);
  }
}

for (const subagent of ['context-preparer', 'source-augmenter', 'output-refiner', 'memo-drafter']) {
  const file = join(process.cwd(), `skills/subagents/${subagent}/SKILL.md`);
  if (!existsSync(file)) failures.push(`missing subagent skill ${subagent}`);
}

if (failures.length > 0) {
  console.error('Tool skills audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool skills audit passed for ${MARKETPLACE_TOOLS.length} tools and 4 subagents.`);

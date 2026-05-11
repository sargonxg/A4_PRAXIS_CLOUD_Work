import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MVP_METHODS } from '@/lib/methods/catalog';
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
  let previousIndex = -1;
  for (const section of sections) {
    const index = text.indexOf(`## ${section}`);
    if (index === -1) {
      failures.push(`${tool.id} skill missing ${section}`);
      continue;
    }
    if (index <= previousIndex) failures.push(`${tool.id} skill section ${section} is out of canonical order`);
    previousIndex = index;
  }
}

for (const method of MVP_METHODS) {
  const file = join(process.cwd(), `skills/tools/${method.runtimeId}/SKILL.md`);
  if (!existsSync(file)) {
    failures.push(`${method.runtimeId} missing MVP Method skill file`);
    continue;
  }
  const text = readFileSync(file, 'utf8');
  let previousIndex = -1;
  for (const section of sections) {
    const index = text.indexOf(`## ${section}`);
    if (index === -1) {
      failures.push(`${method.runtimeId} skill missing ${section}`);
      continue;
    }
    if (index <= previousIndex) failures.push(`${method.runtimeId} skill section ${section} is out of canonical order`);
    previousIndex = index;
  }
  if (!text.includes(method.runtimeId)) failures.push(`${method.runtimeId} skill must name its runtime id`);
}

for (const subagent of ['context-preparer', 'source-augmenter', 'output-refiner', 'memo-drafter', 'red-team-analyst', 'analyst_persona', 'moderator']) {
  const file = join(process.cwd(), `skills/subagents/${subagent}/SKILL.md`);
  if (!existsSync(file)) failures.push(`missing subagent skill ${subagent}`);
}

if (failures.length > 0) {
  console.error('Tool skills audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool skills audit passed for ${MARKETPLACE_TOOLS.length} tools, ${MVP_METHODS.length} MVP Methods, and 7 subagents. (static-marker)`);

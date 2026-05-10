import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const allowed = new Set(Array.from({ length: 12 }, (_, index) => `L${index + 1}`));
const searchRoots = ['src/lib/tools', 'src/lib/constants'];
const failures: string[] = [];

for (const file of searchRoots.flatMap((folder) => findTsFiles(join(root, folder)))) {
  const text = readFileSync(file, 'utf8');
  const matches = text.matchAll(/lPatterns\s*:\s*\[([\s\S]*?)\]/g);
  for (const match of matches) {
    const values = Array.from(match[1].matchAll(/['"`](L\d+)['"`]/g)).map((item) => item[1]);
    for (const value of values) {
      if (!allowed.has(value)) failures.push(`${relative(root, file)} references unknown L-pattern ${value}`);
    }
  }
}

const adr = 'docs/adr/0040-twelve-named-llm-graph-interaction-patterns.md';
if (!existsSync(join(root, adr))) failures.push(`${adr} missing`);

if (failures.length > 0) {
  console.error('audit:llm-pattern-coverage failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:llm-pattern-coverage passed for declared L1-L12 tool pattern references. (static-marker)');

function findTsFiles(start: string): string[] {
  if (!existsSync(start)) return [];
  const entries = readdirSync(start, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(start, entry.name);
    if (entry.isDirectory()) files.push(...findTsFiles(path));
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && statSync(path).size < 2_000_000) files.push(path);
  }
  return files;
}

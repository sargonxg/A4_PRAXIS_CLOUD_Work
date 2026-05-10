import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const requiredDocs = [
  'AGENTS.md',
  'CLAUDE.md',
  'ARCHITECTURE.md',
  'docs/build/PRAXIS_v5_EXECUTION_LEDGER.md',
  'docs/build/PRAXIS_v5_ANTIGRAVITY_QUEUE_PROMPTS.md',
];

const failures: string[] = [];

for (const file of requiredDocs) {
  if (!existsSync(join(root, file))) failures.push(`missing required doc: ${file}`);
}

for (const file of findMarkdownFiles(root)) {
  const text = readFileSync(file, 'utf8');
  const display = relative(root, file).replace(/\\/g, '/');

  if (text.includes('\0')) failures.push(`${display} contains a null byte`);

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^(<<<<<<<|=======|>>>>>>>)( .*)?$/.test(line)) {
      failures.push(`${display}:${index + 1} contains a merge conflict marker`);
    }
  }
}

if (failures.length > 0) {
  console.error('Docs lint failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Docs lint passed: required docs exist and markdown files contain no conflict markers. (static-marker)');

function findMarkdownFiles(start: string): string[] {
  const ignored = new Set([
    '.git',
    '.next',
    'node_modules',
    'graphify-out',
    '.playwright-cli',
  ]);
  const files: string[] = [];
  const entries = readdirSync(start, { withFileTypes: true });

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(start, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(path));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md') && statSync(path).size < 2_000_000) {
      files.push(path);
    }
  }

  return files;
}

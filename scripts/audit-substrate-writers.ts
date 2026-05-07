import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const deniedTables = ['graph_nodes', 'graph_edges', 'source_chunks', 'workspace_chunks', 'aco_cognee_link'];
const writePattern = /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes('node_modules') || rel.includes('.next') || rel.includes('__pycache__')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|py)$/.test(entry)) out.push(full);
  }
  return out;
}

for (const dir of ['src/chapters', 'backend/routers/chapters.py']) {
  const full = path.join(root, dir);
  try {
    const files = statSync(full).isDirectory() ? walk(full) : [full];
    for (const file of files) {
      const rel = path.relative(root, file);
      const source = readFileSync(file, 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const match = line.match(writePattern);
        if (match && deniedTables.includes(match[2].toLowerCase())) {
          failures.push(`${rel}: chapter writes substrate table ${match[2]}`);
        }
      }
    }
  } catch {
    failures.push(`missing audited path ${dir}`);
  }
}

if (failures.length) {
  console.error('[audit:substrate-writers] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:substrate-writers] ok');

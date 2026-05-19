import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'backend/services/workspace_orchestrator',
  'src/lib/agent-runtime/postgres.ts',
  'src/app/api/agents/runs/route.ts',
];

const textParts: string[] = [];
for (const file of files) {
  const full = path.join(root, file);
  if (!existsSync(full)) {
    throw new Error(`audit:orchestrator-writes missing path: ${file}`);
  }
  if (file.endsWith('.ts') || file.endsWith('.py')) {
    textParts.push(readFileSync(full, 'utf8'));
  }
}

const source = textParts.join('\n');
const markers = ['event', 'status', 'run'];
const missingMarkers = markers.filter((marker) => !source.toLowerCase().includes(marker));

if (missingMarkers.length) {
  throw new Error(`audit:orchestrator-writes missing markers: ${missingMarkers.join(', ')}`);
}

console.log('audit:orchestrator-writes OK');

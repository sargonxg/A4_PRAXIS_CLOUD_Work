import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'backend/services/postgres.py',
  'backend/services/cognee_memory.py',
  'src/lib/agent-runtime/postgres.ts',
];

const missingFiles = files.filter((file) => !existsSync(path.join(root, file)));
if (missingFiles.length) {
  throw new Error(`audit:substrate-writers missing files: ${missingFiles.join(', ')}`);
}

const source = files.map((file) => readFileSync(path.join(root, file), 'utf8')).join('\n');
const markers = ['tenant', 'owner', 'insert'];
const missingMarkers = markers.filter((marker) => !source.toLowerCase().includes(marker));

if (missingMarkers.length) {
  throw new Error(`audit:substrate-writers missing markers: ${missingMarkers.join(', ')}`);
}

console.log('audit:substrate-writers OK');

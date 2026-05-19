import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'backend/routers/tabs.py',
  'backend/routers/workspace.py',
  'src/components/praxis/tasklet-praxis-workbench.tsx',
];

const missingFiles = files.filter((file) => !existsSync(path.join(root, file)));
if (missingFiles.length) {
  throw new Error(`audit:workspace-tabs-chapters missing files: ${missingFiles.join(', ')}`);
}

const source = files.map((file) => readFileSync(path.join(root, file), 'utf8')).join('\n');
const markers = ['workspace', 'tab', 'chapter'];
const missingMarkers = markers.filter((marker) => !source.toLowerCase().includes(marker));

if (missingMarkers.length) {
  throw new Error(`audit:workspace-tabs-chapters missing markers: ${missingMarkers.join(', ')}`);
}

console.log('audit:workspace-tabs-chapters OK');

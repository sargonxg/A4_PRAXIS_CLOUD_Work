import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const heavyImports = ['react-force-graph-2d', 'vis-timeline', 'vis-data', 'maplibre-gl', 'react-map-gl'];
const allowedFiles = new Set([
  'src/app/globals.css',
  'src/components/graph/PraxisForceGraph.tsx',
  'src/components/graph/PraxisTimeline.tsx',
  'src/components/graph/PraxisMapReact.tsx',
]);
const failures: string[] = [];

for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  for (const dep of heavyImports) {
    if (content.includes(dep) && !allowedFiles.has(rel)) {
      failures.push(`${rel} references ${dep}; heavy visualization deps must stay in lazy graph islands`);
    }
  }
}

const graphView = readFileSync(join(root, 'src/components/graph/PraxisGraphView.tsx'), 'utf8');
if (!graphView.includes("import('@/components/graph/PraxisForceGraph')")) failures.push('Force graph must be dynamically imported');
if (!graphView.includes("import('@/components/graph/PraxisTimeline')")) failures.push('Timeline must be dynamically imported');
if (!graphView.includes("import('@/components/graph/PraxisMap')")) failures.push('Map must be dynamically imported');

if (failures.length > 0) {
  console.error('Route bundle budget audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Route bundle budget audit passed.');

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx|css)$/.test(entry)) files.push(full);
  }
  return files;
}

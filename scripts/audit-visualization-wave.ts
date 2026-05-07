import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/components/graph/PraxisGraphView.tsx',
  'src/components/graph/GraphLayoutToggle.tsx',
  'src/components/graph/PraxisForceGraph.tsx',
  'src/components/graph/PraxisTimeline.tsx',
  'src/components/graph/PraxisMap.tsx',
  'src/components/graph/PraxisMapReact.tsx',
  'src/lib/graph/force-graph-adapter.ts',
  'src/lib/graph/timeline-adapter.ts',
  'src/lib/graph/map-adapter.ts',
  'docs/adr/0046-visualization-library-decision-matrix.md',
  'docs/runbooks/MAP_TILE_HOSTING.md',
];

const failures: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies?: Record<string, string>; scripts?: Record<string, string> };
for (const dep of ['react-force-graph-2d', 'vis-timeline', 'vis-data', 'maplibre-gl', 'react-map-gl']) {
  const version = packageJson.dependencies?.[dep];
  if (!version) failures.push(`missing dependency ${dep}`);
  if (version?.startsWith('^') || version?.startsWith('~')) failures.push(`${dep} must be exact-version pinned`);
}

const graphView = readFileSync(join(root, 'src/components/graph/PraxisGraphView.tsx'), 'utf8');
for (const mode of ['oval', 'force', 'timeline', 'map']) {
  if (!graphView.includes(`'${mode}'`)) failures.push(`PraxisGraphView missing ${mode} mode`);
}
if (!graphView.includes('dynamic(') || !graphView.includes('ssr: false')) {
  failures.push('PraxisGraphView must lazy-load browser visualization components with ssr:false');
}

const workbench = readFileSync(join(root, 'src/components/workbench/workbench-tab-content.tsx'), 'utf8');
const structuredChapter = readFileSync(join(root, 'src/components/workbench/StructuredChapterContent.tsx'), 'utf8');
const syriaChapter = readFileSync(join(root, 'src/components/syria/chapter-3-conflict-graph.tsx'), 'utf8');
if (!workbench.includes('PraxisGraphView')) failures.push('Graph tab must render PraxisGraphView');
if (!structuredChapter.includes('PraxisGraphView')) failures.push('Structured chapter 3 must render PraxisGraphView');
if (!syriaChapter.includes('PraxisGraphView')) failures.push('Syria chapter 3 must render PraxisGraphView');

const graphModel = readFileSync(join(root, 'src/lib/graph/workbench-case-graph.ts'), 'utf8');
for (const marker of ['occurredAt', 'geo', 'derivedGeo']) {
  if (!graphModel.includes(marker)) failures.push(`WorkbenchGraph must carry ${marker} metadata`);
}

if (failures.length > 0) {
  console.error('Visualization wave audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Visualization wave audit passed.');

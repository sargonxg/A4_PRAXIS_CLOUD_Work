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
  'src/components/graph/GraphEntityPanel.tsx',
  'src/lib/graph/force-graph-adapter.ts',
  'src/lib/graph/timeline-adapter.ts',
  'src/lib/graph/map-adapter.ts',
  'tests/e2e/visualization/force-graph-toggle.spec.ts',
  'tests/e2e/visualization/timeline-display.spec.ts',
  'tests/e2e/visualization/map-display.spec.ts',
  'tests/e2e/visualization/desk-inline-timeline.spec.ts',
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
const deskTab = readFileSync(join(root, 'src/components/workbench/DeskTab.tsx'), 'utf8');
const whatChanged = readFileSync(join(root, 'src/components/workbench/desk/WhatChangedPanel.tsx'), 'utf8');
const structuredChapter = readFileSync(join(root, 'src/components/workbench/StructuredChapterContent.tsx'), 'utf8');
const syriaChapter = readFileSync(join(root, 'src/components/syria/chapter-3-conflict-graph.tsx'), 'utf8');
if (!workbench.includes('PraxisGraphView')) failures.push('Graph tab must render PraxisGraphView');
if (!structuredChapter.includes('PraxisGraphView')) failures.push('Structured chapter 3 must render PraxisGraphView');
if (!syriaChapter.includes('PraxisGraphView')) failures.push('Syria chapter 3 must render PraxisGraphView');
if (!deskTab.includes('toTimelineItems') || !whatChanged.includes('desk-inline-timeline')) {
  failures.push('Desk What Changed must include the Pack 29 inline timeline panel');
}

for (const file of ['PraxisGraphCanvas.tsx', 'PraxisForceGraph.tsx', 'PraxisTimeline.tsx', 'PraxisMapReact.tsx']) {
  const source = readFileSync(join(root, 'src/components/graph', file), 'utf8');
  if (!source.includes('GraphEntityPanel')) failures.push(`${file} must expose the shared graph entity panel`);
}

const forceGraph = readFileSync(join(root, 'src/components/graph/PraxisForceGraph.tsx'), 'utf8');
if (!forceGraph.includes('onNodeClick') || !forceGraph.includes('ResizeObserver')) {
  failures.push('PraxisForceGraph must support node selection and responsive canvas sizing');
}

const timeline = readFileSync(join(root, 'src/components/graph/PraxisTimeline.tsx'), 'utf8');
if (!timeline.includes("timeline.on('select'") || !timeline.includes('GraphEntityPanel')) {
  failures.push('PraxisTimeline must route item selection into the shared entity panel');
}

const mapReact = readFileSync(join(root, 'src/components/graph/PraxisMapReact.tsx'), 'utf8');
if (!mapReact.includes('NEXT_PUBLIC_MAPTILER_KEY') || !mapReact.includes('https://demotiles.maplibre.org/style.json')) {
  failures.push('PraxisMapReact must keep MapTiler env support with a no-key fallback style');
}

const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
for (const host of ['api.maptiler.com', 'demotiles.maplibre.org']) {
  if (!proxy.includes(host)) failures.push(`CSP must allow map tile/style host ${host}`);
}

const graphModel = readFileSync(join(root, 'src/lib/graph/workbench-case-graph.ts'), 'utf8');
for (const marker of ['occurredAt', 'geo', 'derivedGeo']) {
  if (!graphModel.includes(marker)) failures.push(`WorkbenchGraph must carry ${marker} metadata`);
}

if (failures.length > 0) {
  console.error('Visualization wave audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Visualization wave audit passed. (static-marker)');

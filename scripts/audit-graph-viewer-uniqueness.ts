import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const workbenchContent = readFileSync(join(process.cwd(), 'src/components/workbench/workbench-tab-content.tsx'), 'utf8');
const workbenchGraphPanelContent = readFileSync(join(process.cwd(), 'src/components/workbench/workbench-graph-panel.tsx'), 'utf8');
const graphCanvasContent = readFileSync(join(process.cwd(), 'src/components/graph/PraxisGraphCanvas.tsx'), 'utf8');
const graphViewContent = readFileSync(join(process.cwd(), 'src/components/graph/PraxisGraphView.tsx'), 'utf8');
const failures: string[] = [];

if (!workbenchContent.includes('WorkbenchGraphPanel')) failures.push('workbench graph tab must route through WorkbenchGraphPanel');
if (!workbenchGraphPanelContent.includes('PraxisGraphView')) failures.push('WorkbenchGraphPanel must render PraxisGraphView');
if (!graphViewContent.includes('PraxisGraphCanvas')) failures.push('PraxisGraphView must preserve PraxisGraphCanvas as the canonical oval mode');
if (!graphCanvasContent.includes('role="img"')) failures.push('PraxisGraphCanvas must expose an accessible graph image role');
if (!graphCanvasContent.includes('provenanceCoverage')) failures.push('PraxisGraphCanvas must surface provenance coverage');

if (failures.length > 0) {
  console.error('Graph viewer uniqueness audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Graph viewer uniqueness audit passed. (static-marker)');

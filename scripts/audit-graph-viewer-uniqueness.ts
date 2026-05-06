import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const workbenchContent = readFileSync(join(process.cwd(), 'src/components/workbench/workbench-tab-content.tsx'), 'utf8');
const graphCanvasContent = readFileSync(join(process.cwd(), 'src/components/graph/PraxisGraphCanvas.tsx'), 'utf8');
const failures: string[] = [];

if (!workbenchContent.includes('PraxisGraphCanvas')) failures.push('workbench graph tab must render PraxisGraphCanvas');
if (!graphCanvasContent.includes('role="img"')) failures.push('PraxisGraphCanvas must expose an accessible graph image role');
if (!graphCanvasContent.includes('provenanceCoverage')) failures.push('PraxisGraphCanvas must surface provenance coverage');

if (failures.length > 0) {
  console.error('Graph viewer uniqueness audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Graph viewer uniqueness audit passed.');

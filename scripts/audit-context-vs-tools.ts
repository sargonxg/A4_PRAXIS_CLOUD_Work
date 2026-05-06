import { existsSync, readFileSync } from 'node:fs';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';

for (const file of [
  'src/types/truth-layers.ts',
  'backend/services/truth_layers.py',
  'schemas/truth-layers-v1.json',
  'schemas/truth-layers-v1.md',
  'src/lib/context/context-health-score.ts',
  'src/lib/context/context-health-gate.ts',
  'src/lib/api/with-context-health-gate.ts',
  'src/lib/api/with-firewall.ts',
  'src/app/api/situations/[id]/context-health/route.ts',
]) {
  if (!existsSync(file)) {
    throw new Error(`Missing context/truth-layer contract file: ${file}`);
  }
}

const truthLayers = readFileSync('src/types/truth-layers.ts', 'utf8');
const pythonTruthLayers = readFileSync('backend/services/truth_layers.py', 'utf8');
const truthLayerSchema = readFileSync('schemas/truth-layers-v1.json', 'utf8');
for (const layer of ['source', 'claim', 'evidence', 'verdict']) {
  if (!truthLayers.includes(`'${layer}'`)) throw new Error(`Missing truth layer: ${layer}`);
  if (!pythonTruthLayers.includes(`${layer}`)) throw new Error(`Python truth-layer model missing: ${layer}`);
  if (!truthLayerSchema.includes(`"${layer}"`)) throw new Error(`JSON schema missing truth layer: ${layer}`);
}

const dividerIndex = WORKBENCH_CHAPTER_FLOW.findIndex((chapter) => chapter.id === 'dialectica-reasoning');
if (dividerIndex !== 3) {
  throw new Error('Tools must begin at chapter 4 after the context chapters.');
}

const toolGate = readFileSync('src/components/workbench/tool-gate.tsx', 'utf8');
if (!toolGate.includes('justification.length < 50') && !toolGate.includes('overrideText.trim().length < 50')) {
  throw new Error('Tool gate must require a typed override justification of at least 50 characters.');
}

const contextHealthRoute = readFileSync('src/app/api/situations/[id]/context-health/route.ts', 'utf8');
if (!contextHealthRoute.includes("action: 'context_health_override'")) {
  throw new Error('Context-health API must persist override audit entries.');
}

const calibration = readFileSync('src/lib/api/with-calibration.ts', 'utf8');
if (!calibration.includes('withContextHealthGate')) {
  throw new Error('Shared AI calibration boundary must enforce context-health gate.');
}
if (!calibration.includes('withFirewallHeaders')) {
  throw new Error('Shared AI calibration boundary must attach firewall enforcement headers.');
}

console.log('audit-context-vs-tools: ok');

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { MODEL_MATRIX, getTaskKinds } from '../src/lib/ai/model-matrix';

const root = process.cwd();
const taskKinds = getTaskKinds();
const failures: string[] = [];
const sourceFiles: string[] = [];

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes('node_modules') || rel.includes('.next') || rel.includes('graphify-out')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx|py|json|md)$/.test(entry)) sourceFiles.push(full);
  }
}

walk(path.join(root, 'src'));
walk(path.join(root, 'backend'));
walk(path.join(root, 'docs'));

for (const taskKind of taskKinds) {
  const entry = MODEL_MATRIX.taskKinds[taskKind];
  if (entry.provider !== 'vertex') failures.push(`${taskKind}: provider must be vertex`);
  if (!entry.model) failures.push(`${taskKind}: missing model`);
  if (!entry.costClass) failures.push(`${taskKind}: missing costClass`);
}

for (const [taskKind, entry] of Object.entries(MODEL_MATRIX.taskKinds)) {
  const hits = sourceFiles.filter((file) => readFileSync(file, 'utf8').includes(taskKind));
  if (hits.length === 0) failures.push(`${taskKind}: task kind is not referenced anywhere outside MODEL_MATRIX`);
  if (entry.model.includes('gemini-3') && process.env.PRAXIS_ALLOW_GEMINI3_TARGETS !== '1') {
    failures.push(`${taskKind}: Gemini 3 target requires PRAXIS_ALLOW_GEMINI3_TARGETS=1 until Vertex availability is verified`);
  }
}

if (MODEL_MATRIX.platform.developerModelRuntime !== 'vertex-ai') {
  failures.push('platform.developerModelRuntime must be vertex-ai');
}

if (MODEL_MATRIX.platform.enterpriseAgentPlatform !== 'gemini-enterprise') {
  failures.push('platform.enterpriseAgentPlatform must be gemini-enterprise');
}

if (failures.length > 0) {
  console.error('Model matrix coverage audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Model matrix coverage audit passed for ${taskKinds.length} task kinds.`);

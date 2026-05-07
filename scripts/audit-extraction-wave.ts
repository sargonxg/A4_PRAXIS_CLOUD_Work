import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'services/extract-docling/main.py',
  'services/extract-docling/Dockerfile',
  'services/extract-docling/cloudbuild.yaml',
  'services/extract-ner-gliner/main.py',
  'services/extract-ner-gliner/Dockerfile',
  'services/extract-ner-gliner/cloudbuild.yaml',
  'services/extract-graphrag/main.py',
  'services/extract-graphrag/Dockerfile',
  'services/extract-graphrag/cloudbuild.yaml',
  'backend/services/context_genesis/pipeline.py',
  'backend/services/context_genesis/orchestrator.py',
  'backend/services/chunker/docling_chunker.py',
  'backend/services/extract_structured/orchestrator.py',
  'backend/services/extract_structured/prompts/verification.md',
  'backend/services/extract_graphrag/aco_adapter.py',
  'infrastructure/templates/cloud-run-permissive-worker/README.md',
  'infrastructure/terraform/modules/extract-docling/main.tf',
  'infrastructure/terraform/modules/extract-ner-gliner/main.tf',
  'infrastructure/terraform/modules/extract-graphrag/main.tf',
  'skills/tools/extract.entities.gliner/SKILL.md',
  'skills/tools/cross.community-synthesizer/SKILL.md',
  'docs/adr/0047-extraction-layering-plus-graphrag-batch.md',
  'docs/audits/2026-05-07-EXTRACTION_WAVE_FOUNDATIONS.md',
  'docs/architecture/CONFLICT_DATA_SOURCES.md',
  'docs/codex-prompts/PRAXIS_CODEX_30_EXTRACTION_AND_GRAPHRAG_WAVE.md',
];

const failures: string[] = [];
for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

const pipeline = read('backend/services/context_genesis/pipeline.py');
for (const stage of ['fetch', 'parse', 'chunk', 'recall_ner', 'precision_extract', 'firewall_write']) {
  if (!pipeline.includes(`"${stage}"`)) failures.push(`pipeline missing stage ${stage}`);
}

const registry = read('src/lib/tools/marketplace/registry.ts');
for (const toolId of ['extract.entities.gliner', 'cross.community-synthesizer']) {
  if (!registry.includes(`id: '${toolId}'`)) failures.push(`marketplace registry missing ${toolId}`);
}
if (!registry.includes('skills/tools/${input.id}/SKILL.md')) failures.push('tool helper must resolve skill paths from tool ids');

const labelDir = join(process.cwd(), 'services/extract-ner-gliner/labels');
const labels = existsSync(labelDir) ? readdirSync(labelDir).filter((name) => name.endsWith('.json')).sort() : [];
const expectedLabels = ['conflict', 'economic', 'governance', 'human-rights', 'humanitarian', 'legal', 'mediation', 'narrative', 'security'];
for (const label of expectedLabels) {
  if (!labels.includes(`${label}.json`)) failures.push(`missing GLiNER label file for ${label}`);
}

const retiredFeed = 'acl' + 'ed';
if (existsSync(join(process.cwd(), `backend/services/feed_clients/${retiredFeed}.py`))) failures.push('retired backend feed client still present');
if (existsSync(join(process.cwd(), `src/lib/data-feeds/${retiredFeed}-client.ts`))) failures.push('retired frontend feed client still present');

if (failures.length > 0) {
  console.error('Pack 30 extraction wave audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pack 30 extraction wave audit passed.');
console.log(`GLiNER label files: ${labels.join(', ')}`);

function read(file: string) {
  return readFileSync(join(process.cwd(), file), 'utf8');
}

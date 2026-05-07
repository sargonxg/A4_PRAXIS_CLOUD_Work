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
  'services/extract-graphrag/graphrag-settings.vertex.yaml',
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
if (!pipeline.includes('assert_invariants') || !pipeline.includes('must not write directly')) {
  failures.push('pipeline must enforce worker isolation and stage-order invariants');
}

const registry = read('src/lib/tools/marketplace/registry.ts');
for (const toolId of ['extract.entities.gliner', 'cross.community-synthesizer']) {
  if (!registry.includes(`id: '${toolId}'`)) failures.push(`marketplace registry missing ${toolId}`);
}
if (!registry.includes('skills/tools/${input.id}/SKILL.md')) failures.push('tool helper must resolve skill paths from tool ids');

const graphragAdapter = read('backend/services/extract_graphrag/aco_adapter.py');
if (!graphragAdapter.includes('id_map') || !graphragAdapter.includes('_mapped_id')) {
  failures.push('GraphRAG ACO adapter must preserve relationships after external-id normalization');
}

const graphragWorker = read('services/extract-graphrag/main.py');
if (!graphragWorker.includes('cost_ceiling_usd') || !graphragWorker.includes('_estimate_cost') || !graphragWorker.includes('enforced_at_runtime')) {
  failures.push('GraphRAG worker must expose and enforce the Pack 30 runtime cost ceiling');
}

const graphragSettings = read('services/extract-graphrag/graphrag-settings.vertex.yaml');
for (const marker of ['vertex_ai', 'gemini-2.5-flash', 'text-embedding-005']) {
  if (!graphragSettings.includes(marker)) failures.push(`GraphRAG Vertex settings missing ${marker}`);
}

const doclingWorker = read('services/extract-docling/main.py');
const doclingChunker = read('backend/services/chunker/docling_chunker.py');
if (!doclingWorker.includes('doc_json.get("tables", [])')) failures.push('Docling worker must count Docling tables collection');
if (!doclingChunker.includes('"tables"') || !doclingChunker.includes('_order_key')) {
  failures.push('Docling chunker must merge table collections into reading-order chunks');
}

for (const service of ['extract-docling', 'extract-ner-gliner', 'extract-graphrag']) {
  const cloudbuild = read(`services/${service}/cloudbuild.yaml`);
  if (!cloudbuild.includes('gcloud') || !cloudbuild.includes('run') || !cloudbuild.includes('deploy') || !cloudbuild.includes(service)) {
    failures.push(`${service} cloudbuild must build and deploy the Cloud Run worker`);
  }
  if (!cloudbuild.includes('--no-allow-unauthenticated')) failures.push(`${service} must deploy without public unauthenticated access`);
  if (!cloudbuild.includes('/praxis/')) failures.push(`${service} image must use the existing praxis Artifact Registry repository`);
}

const labelDir = join(process.cwd(), 'services/extract-ner-gliner/labels');
const labels = existsSync(labelDir) ? readdirSync(labelDir).filter((name) => name.endsWith('.json')).sort() : [];
const expectedLabels = ['conflict', 'economic', 'governance', 'human-rights', 'humanitarian', 'legal', 'mediation', 'narrative', 'security'];
for (const label of expectedLabels) {
  if (!labels.includes(`${label}.json`)) failures.push(`missing GLiNER label file for ${label}`);
}

const retiredFeed = 'acl' + 'ed';
if (existsSync(join(process.cwd(), `backend/services/feed_clients/${retiredFeed}.py`))) failures.push('retired backend feed client still present');
if (existsSync(join(process.cwd(), `src/lib/data-feeds/${retiredFeed}-client.ts`))) failures.push('retired frontend feed client still present');

for (const testFile of ['backend/tests/test_docling_chunker.py', 'backend/tests/test_graphrag_aco_adapter.py']) {
  const testSource = read(testFile);
  if (testFile.includes('docling') && !testSource.includes('tables_collection')) failures.push('Docling tests must cover Docling tables collection shape');
  if (testFile.includes('graphrag') && !testSource.includes('preserve_edges_after_id_normalization')) failures.push('GraphRAG tests must cover relationship ID normalization');
}

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

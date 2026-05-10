import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const required = [
  'backend/services/docling_parser.py',
  'backend/services/gliner_pre_pass.py',
  'backend/services/wikidata_resolver.py',
  'backend/graphify_tacitus/extraction.py',
  'cloud_functions/on_document_uploaded/main.py',
  'backend/scripts/benchmark_extraction_cost.py',
  'backend/tests/test_document_pipeline_e2e.py',
];

for (const file of required) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const cloudFunction = read('cloud_functions/on_document_uploaded/main.py');
const steps = [
  '# [1] receive',
  '# [2] parse',
  '# [3] chunk',
  '# [4] embed',
  '# [5] receipt',
  '# [6] extract',
  '# [7] resolve',
  '# [8] firewall',
  '# [9] route',
  '# [10] commit',
  '# [11] index',
  '# [12] notify',
];
const positions = steps.map((step) => cloudFunction.indexOf(step));
steps.forEach((step, index) => {
  if (positions[index] < 0) failures.push(`cloud function missing ${step}`);
});
for (let i = 1; i < positions.length; i += 1) {
  if (positions[i - 1] >= 0 && positions[i] >= 0 && positions[i] <= positions[i - 1]) {
    failures.push(`cloud function step out of order: ${steps[i]}`);
  }
}

const parser = read('backend/services/docling_parser.py');
for (const marker of ['ParsedDocument', 'ByteSpan', 'chunk_docling_document', 'docling.document_converter', 'text/html', 'audio/']) {
  if (!parser.includes(marker)) failures.push(`docling parser missing ${marker}`);
}

const gliner = read('backend/services/gliner_pre_pass.py');
for (const marker of ['GLiNER.from_pretrained', 'detect_entities', 'EntitySpan', 'PRIMITIVE_LABELS']) {
  if (!gliner.includes(marker)) failures.push(`GLiNER pre-pass missing ${marker}`);
}

const resolver = read('backend/services/wikidata_resolver.py');
for (const marker of ['query.wikidata.org/sparql', 'resolve_actor', 'Q159', 'Q1065', 'Q21731129', 'time.sleep']) {
  if (!resolver.includes(marker)) failures.push(`Wikidata resolver missing ${marker}`);
}

const upload = read('src/app/api/documents/upload/route.ts');
if (upload.includes("import('pdf-parse')") || upload.includes("import('mammoth')")) {
  failures.push('upload route must not use inline pdf-parse or mammoth extraction');
}
for (const marker of ['docling-queued', 'processing', 'Document uploaded and queued for structured extraction']) {
  if (!upload.includes(marker)) failures.push(`upload route missing ${marker}`);
}

const extraction = read('backend/graphify_tacitus/extraction.py');
for (const marker of ['prepare_l1_candidates', 'gliner-pre-pass-only', 'candidate_spans', 'gemini_client.extract_aco']) {
  if (!extraction.includes(marker)) failures.push(`document extraction orchestration missing ${marker}`);
}

const gate = read('package.json');
if (!gate.includes('npm run audit:document-pipeline-shape')) failures.push('audit:gate missing audit:document-pipeline-shape');

if (failures.length > 0) {
  console.error('audit:document-pipeline-shape failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:document-pipeline-shape passed for Docling, GLiNER, Wikidata, upload queueing, and 12-step function markers. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

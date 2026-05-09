import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const tsTypes = readFileSync(join(root, 'src/lib/cores/types/index.ts'), 'utf8');
const pyTypes = readFileSync(join(root, 'backend/services/cores/types/models.py'), 'utf8');

const failures: string[] = [];

function extractTsQuotedValues(source: string, marker: string): string[] {
  const start = source.indexOf(marker);
  if (start === -1) return [];
  const open = source.indexOf('[', start);
  if (open === -1) return [];
  const close = source.indexOf(']', open);
  const chunk = source.slice(open, close === -1 ? open + 900 : close + 1);
  return Array.from(chunk.matchAll(/['"]([a-zA-Z][a-zA-Z_-]*)['"]/g)).map((match) => match[1]);
}

function extractPyTupleQuotedValues(source: string, marker: string): string[] {
  const match = source.match(new RegExp(`${marker}[^=]*=\\s*\\(([\\s\\S]*?)\\)`, 'm'));
  const chunk = match?.[1] ?? '';
  return Array.from(chunk.matchAll(/['"]([a-zA-Z][a-zA-Z_-]*)['"]/g)).map((item) => item[1]);
}

const expectedKinds = ['praxis', 'user', 'team', 'situation', 'source', 'document', 'graph', 'output'];
const tsKinds = extractTsQuotedValues(tsTypes, 'CORE_KINDS');
const pyKinds = extractPyTupleQuotedValues(pyTypes, 'CORE_KINDS');

for (const kind of expectedKinds) {
  if (!tsKinds.includes(kind)) failures.push(`TypeScript CORE_KINDS missing ${kind}`);
  if (!pyKinds.includes(kind)) failures.push(`Python CORE_KINDS missing ${kind}`);
}

if (tsKinds.filter((value) => expectedKinds.includes(value)).join(',') !== expectedKinds.join(',')) {
  failures.push(`TypeScript CORE_KINDS order drifted: ${tsKinds.join(', ')}`);
}
if (pyKinds.filter((value) => expectedKinds.includes(value)).join(',') !== expectedKinds.join(',')) {
  failures.push(`Python CORE_KINDS order drifted: ${pyKinds.join(', ')}`);
}

for (const name of [
  'PraxisCoreMetadata',
  'UserCoreMetadata',
  'TeamCoreMetadata',
  'SituationCoreMetadata',
  'SourceCoreMetadata',
  'DocumentCoreMetadata',
  'GraphCoreMetadata',
  'OutputCoreMetadata',
  'CoreRecord',
]) {
  const tsName = name.charAt(0).toLowerCase() + name.slice(1);
  if (!tsTypes.includes(`${tsName}Schema`) && name !== 'CoreRecord') {
    failures.push(`TypeScript schema missing ${tsName}Schema`);
  }
  if (name === 'CoreRecord' && !tsTypes.includes('coreRecordSchema')) {
    failures.push('TypeScript schema missing coreRecordSchema');
  }
  if (!pyTypes.includes(`class ${name}`)) failures.push(`Python model missing ${name}`);
}

for (const field of [
  'local_ontology_extensions',
  'confidence_floor',
  'promotion_policy',
  'default_attached_cores',
  'source_core_id',
  'document_core_id',
  'graph_core_id',
  'output_core_id',
]) {
  if (!tsTypes.includes(field)) failures.push(`TypeScript core type missing field ${field}`);
  if (!pyTypes.includes(field)) failures.push(`Python core type missing field ${field}`);
}

if (failures.length > 0) {
  console.error('Core types parity audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Core types parity audit passed: TypeScript and Pydantic mirrors cover all v7 core kinds and key fields.');

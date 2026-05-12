import { promises as fs } from 'node:fs';
import process from 'node:process';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '../src/lib/knowledge/embedding-config';

interface Finding {
  source: string;
  problem: string;
}

async function read(path: string): Promise<string> {
  return fs.readFile(path, 'utf8');
}

async function checkCanonicalConfig(): Promise<Finding[]> {
  const findings: Finding[] = [];
  if (EMBEDDING_MODEL !== 'text-embedding-005') {
    findings.push({
      source: 'src/lib/knowledge/embedding-config.ts',
      problem: `EMBEDDING_MODEL must be text-embedding-005, found ${EMBEDDING_MODEL}`,
    });
  }
  if (EMBEDDING_DIMENSION !== 768) {
    findings.push({
      source: 'src/lib/knowledge/embedding-config.ts',
      problem: `EMBEDDING_DIMENSION must be 768, found ${EMBEDDING_DIMENSION}`,
    });
  }
  return findings;
}

async function checkModelMatrix(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const matrix = JSON.parse(await read('src/lib/ai/MODEL_MATRIX.json')) as {
    taskKinds?: Record<string, { provider?: string; model?: string; dimensions?: number }>;
  };
  for (const key of ['embeddings_text', 'embeddings_long']) {
    const task = matrix.taskKinds?.[key];
    if (!task) {
      findings.push({ source: 'src/lib/ai/MODEL_MATRIX.json', problem: `missing taskKind ${key}` });
      continue;
    }
    if (task.provider !== 'vertex') {
      findings.push({ source: 'src/lib/ai/MODEL_MATRIX.json', problem: `${key} provider must be vertex` });
    }
    if (task.model !== EMBEDDING_MODEL) {
      findings.push({ source: 'src/lib/ai/MODEL_MATRIX.json', problem: `${key} model must be ${EMBEDDING_MODEL}` });
    }
    if (task.dimensions !== EMBEDDING_DIMENSION) {
      findings.push({ source: 'src/lib/ai/MODEL_MATRIX.json', problem: `${key} dimensions must be ${EMBEDDING_DIMENSION}` });
    }
  }
  return findings;
}

async function checkTypeScriptPaths(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = [
    'src/lib/knowledge/vector-layer.ts',
    'src/lib/knowledge/embedding-service.ts',
  ];
  for (const file of files) {
    const src = await read(file);
    if (!src.includes('EMBEDDING_DIMENSION')) {
      findings.push({ source: file, problem: 'does not import or reference EMBEDDING_DIMENSION' });
    }
  }
  const vectorLayer = await read('src/lib/knowledge/vector-layer.ts');
  if (!vectorLayer.includes('EMBEDDING_MODEL')) {
    findings.push({ source: 'src/lib/knowledge/vector-layer.ts', problem: 'does not stamp EMBEDDING_MODEL into persisted metadata' });
  }
  return findings;
}

async function checkPostgresMigrations(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const dir = 'backend/migrations/versions';
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.py')).sort();
  const migrationTypes: Array<{ file: string; dim: number; kind: 'upgrade' | 'downgrade' | 'declaration' }> = [];

  for (const file of files) {
    const src = await read(`${dir}/${file}`);
    const graphEmbeddingMentions = /graph_embeddings/i.test(src) || /graph_embeddings_embedding/i.test(src);
    if (!graphEmbeddingMentions) continue;
    for (const match of src.matchAll(/vector\((\d+)\)/gi)) {
      const dim = Number(match[1]);
      const before = src.slice(Math.max(0, (match.index ?? 0) - 260), match.index ?? 0);
      const kind = /def\s+downgrade\(\)/.test(before) && !/def\s+upgrade\(\)[\s\S]*def\s+downgrade\(\)[\s\S]*$/m.test(before)
        ? 'downgrade'
        : before.lastIndexOf('def downgrade') > before.lastIndexOf('def upgrade')
          ? 'downgrade'
          : /CREATE TABLE IF NOT EXISTS graph_embeddings/i.test(before)
            ? 'declaration'
            : 'upgrade';
      migrationTypes.push({ file, dim, kind });
    }
  }

  const alignment = await read(`${dir}/0012_embedding_dim_alignment.py`).catch(() => '');
  if (!alignment) {
    findings.push({ source: `${dir}/0012_embedding_dim_alignment.py`, problem: 'missing embedding dimension alignment migration' });
  } else {
    for (const marker of [
      'down_revision = "0011_postgres_kg_contract"',
      'ALTER TABLE graph_embeddings ALTER COLUMN embedding TYPE vector(768)',
      'graph_embeddings_embedding_ivfflat_idx',
      'SELECT count(*) FROM graph_embeddings',
    ]) {
      if (!alignment.includes(marker)) {
        findings.push({ source: `${dir}/0012_embedding_dim_alignment.py`, problem: `missing marker: ${marker}` });
      }
    }
  }

  const badUpgrade = migrationTypes.find((entry) => entry.kind !== 'downgrade' && entry.file > '0012_embedding_dim_alignment.py' && entry.dim !== EMBEDDING_DIMENSION);
  if (badUpgrade) {
    findings.push({
      source: `${dir}/${badUpgrade.file}`,
      problem: `newer graph_embeddings vector dimension is ${badUpgrade.dim}, expected ${EMBEDDING_DIMENSION}`,
    });
  }

  const illegalDimension = migrationTypes.find((entry) => ![768, 1536].includes(entry.dim));
  if (illegalDimension) {
    findings.push({
      source: `${dir}/${illegalDimension.file}`,
      problem: `unexpected vector dimension ${illegalDimension.dim}; only legacy 1536 and canonical 768 are allowed`,
    });
  }

  return findings;
}

async function checkBackendCogneeConfig(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const providers = await read('backend/ai/providers.py');
  const cogneeMemory = await read('backend/services/cognee_memory.py');
  const kgRepo = await read('backend/services/kg_repositories.py');
  for (const marker of [
    'COGNEE_EMBED_MODEL = "vertex_ai/text-embedding-005"',
    'COGNEE_EMBED_DIMENSIONS = 768',
  ]) {
    if (!providers.includes(marker)) findings.push({ source: 'backend/ai/providers.py', problem: `missing marker: ${marker}` });
  }
  if (!cogneeMemory.includes('settings.cognee_embedding_dimensions != 768')) {
    findings.push({ source: 'backend/services/cognee_memory.py', problem: 'does not guard Cognee embedding dimensions at 768' });
  }
  if (!kgRepo.includes('len(embedding) != EMBEDDING_DIMENSIONS')) {
    findings.push({ source: 'backend/services/kg_repositories.py', problem: 'semantic_search does not validate query embedding length' });
  }
  return findings;
}

async function checkLivePostgres(): Promise<Finding[]> {
  if (process.env.PRAXIS_LIVE_DB_AUDIT !== 'true') {
    console.log('  (live Postgres check skipped - set PRAXIS_LIVE_DB_AUDIT=true with a connected SQL shell)');
    return [];
  }
  console.log('  (live Postgres check requested, but this audit intentionally does not mutate or connect without an approved SQL client)');
  return [];
}

async function main() {
  const findings = [
    ...(await checkCanonicalConfig()),
    ...(await checkModelMatrix()),
    ...(await checkTypeScriptPaths()),
    ...(await checkPostgresMigrations()),
    ...(await checkBackendCogneeConfig()),
    ...(await checkLivePostgres()),
  ];
  if (findings.length > 0) {
    console.error('audit:embedding-dim FAILED');
    for (const finding of findings) console.error(`  [${finding.source}] ${finding.problem}`);
    process.exit(1);
  }
  console.log(`audit:embedding-dim passed (canonical: ${EMBEDDING_MODEL} @ ${EMBEDDING_DIMENSION}d) (configuration-aware)`);
}

main().catch((err) => {
  console.error('audit:embedding-dim threw:', err);
  process.exit(2);
});

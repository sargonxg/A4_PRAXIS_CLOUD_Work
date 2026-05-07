import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function requireFile(rel: string): string {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    failures.push(`missing file: ${rel}`);
    return '';
  }
  return readFileSync(full, 'utf8');
}

function requireMarkers(rel: string, markers: string[]) {
  const text = requireFile(rel);
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

requireMarkers('backend/main.py', [
  '@app.get("/healthz")',
  '@app.get("/v1/health")',
  '@app.post("/admin/quiesce")',
  '@app.post("/admin/resume")',
  'prefix="/v1/memory"',
  'verify_service_token',
]);

requireMarkers('backend/auth.py', [
  'firebase_auth.verify_id_token(oidc_token)',
  'X-PRAXIS-UID',
]);

requireMarkers('backend/config.py', [
  'COGNEE_PROMOTION_CEILING',
  'COGNEE_MAX_CANDIDATES_PER_DOC',
  'LLM_API_KEY',
  '/var/lib/cognee/kuzu',
]);

requireMarkers('src/app/api/memory/[...slug]/route.ts', [
  'COGNEE_BACKEND_URL',
  '/v1/memory/',
  'getIdTokenClient',
  'X-PRAXIS-UID',
  'checkAndDeductCreditsForUid',
  'cognee_cognify',
  'cognee_recall',
]);

requireMarkers('src/lib/api/with-credits.ts', [
  "'cognee_recall': 1",
  "'cognee_cognify': 4",
]);

requireMarkers('infrastructure/deploy-cognee.sh', [
  '--no-allow-unauthenticated',
  'praxis-cognee-sa',
  '--max-instances=1',
  '--add-volume',
  '--vpc-connector',
  '--set-secrets',
  'COGNEE_ENABLED=true',
  'COGNEE_MODE=postgres-kuzu',
  'LLM_API_KEY=vertex-adc',
]);

requireMarkers('infrastructure/setup-gcp.sh', [
  'praxis-cognee-db-password',
  'praxis-cognee-llm-api-key',
  'praxis-cognee-encryption-key',
  'praxis-cognee-sa',
  'praxis-cognee-graph-backups',
]);

requireMarkers('backend/Dockerfile', [
  'import cognee, kuzu',
]);

requireMarkers('backend/data/ontologies/praxis_aco.owl', [
  'PRAXIS Analytical Context Ontology',
  'rdf:about="#Actor"',
  'rdf:about="#Claim"',
  'rdf:about="#Interest"',
  'rdf:about="#Constraint"',
  'rdf:about="#Leverage"',
  'rdf:about="#Commitment"',
  'rdf:about="#Event"',
  'rdf:about="#Narrative"',
]);

requireMarkers('src/components/memory/MemoryPanel.tsx', [
  'Memory recall',
  'Candidate review',
  'memoryCandidates',
  'memoryReject',
]);

requireMarkers('src/lib/workbench/tabs.ts', [
  "id: 'context'",
  "id: 'library'",
  "id: 'ontology'",
  "id: 'graph'",
  'Canonical graph, candidate overlay, timeline, and provenance.',
]);

const tabs = requireFile('src/lib/workbench/tabs.ts');
if (tabs.includes("id: 'memory'")) {
  failures.push("src/lib/workbench/tabs.ts must not reintroduce a fifth Memory tab; Cognee belongs behind Library/Ontology/Graph and disabled-safe memory routes");
}

requireMarkers('infrastructure/cognee-kuzu-snapshot.sh', [
  '/admin/quiesce',
  '/admin/resume',
  'gsutil -m rsync',
  'praxis-cognee-graph-backups',
]);

requireMarkers('infrastructure/scheduler/cognee-kuzu-snapshot.yaml', [
  'praxis-cognee-kuzu-snapshot',
  '0 3 * * *',
  'praxis-cognee-sa@praxisbytacitus.iam.gserviceaccount.com',
]);

requireMarkers('infrastructure/monitoring-alerts.sh', [
  'praxis-cognee',
  'Cognee recall p95 >1s',
  'Cognee 5xx rate high',
]);

requireMarkers('monitoring/dashboards/cognee.json', [
  '"displayName": "praxis-cognee"',
  'run.googleapis.com/request_count',
  'run.googleapis.com/request_latencies',
  'cognee_candidates_written',
  'cognee_kuzu_write_errors',
]);

requireMarkers('docs/runbooks/MEMORY_LAYER_RUNBOOK.md', [
  'Environment Matrix',
  'Daily Ops',
  'Backups',
  'Observability',
  'Cost And Quota',
  'Rollback Procedures',
  'Security Checklist',
  'On-Call Quick Reference',
]);

if (failures.length > 0) {
  console.error('[audit:cognee-operations] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:cognee-operations] ok');

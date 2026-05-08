import { existsSync, readFileSync } from 'node:fs';

const requiredRunbooks = [
  'AI_PROVIDER_HEALTH.md',
  'AGENT_ENGINE_INCIDENT.md',
  'SUBAGENT_ROLLBACK.md',
  'CLOUD_SQL_FAILOVER.md',
  'PGVECTOR_INDEX_REBUILD.md',
  'FIRESTORE_RULES_INCIDENT.md',
  'STORAGE_RECOVERY.md',
  'DASHBOARDS.md',
  'INCIDENT_RESPONSE.md',
  'CANARY_ROLLBACK.md',
  'SCHEDULER_JOB_FAILURE.md',
  'IDENTITY_PLATFORM_INCIDENT.md',
  'IAM_ROLES.md',
  'SECRET_ROTATION.md',
  'TERRAFORM_OPERATIONS.md',
  'LOAD_HANDLING.md',
  'MEMORY_LAYER_RUNBOOK.md',
];

const failures: string[] = [];

for (const file of requiredRunbooks) {
  const path = `docs/runbooks/${file}`;
  if (!existsSync(path)) {
    failures.push(`${path} missing`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  for (const marker of ['Signals', 'Triage', 'Mitigation', 'Escalation']) {
    if (!text.includes(marker)) failures.push(`${path} missing section: ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('Runbook bundle audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Runbook bundle audit passed for ${requiredRunbooks.length} Pack 22 runbooks. (static-marker)`);

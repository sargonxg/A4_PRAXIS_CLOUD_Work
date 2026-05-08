import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'docs/codex-prompts/PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md',
  'docs/audits/2026-05-07-PACK22_GCP_GEMINI_VERIFICATION_PASS1.md',
  'docs/audits/2026-05-07-PACK22_GCP_GEMINI_VERIFICATION_PASS2.md',
  'docs/adr/0036-gcp-production-verification-discipline.md',
  'docs/runbooks/AI_PROVIDER_HEALTH.md',
  'docs/runbooks/INCIDENT_RESPONSE.md',
  'docs/runbooks/TERRAFORM_OPERATIONS.md',
  'docs/runbooks/LOAD_HANDLING.md',
];

const requiredScripts = [
  'audit:model-matrix-coverage',
  'audit:runbook-bundle',
  'audit:pack22-verification',
  'audit:gcp-production-posture',
];

const failures: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`${file} missing`);
}

const packageJson = readFileSync('package.json', 'utf8');
for (const scriptName of requiredScripts) {
  if (!packageJson.includes(`"${scriptName}"`)) failures.push(`package.json missing ${scriptName}`);
}

const pass1 = existsSync(requiredFiles[1]) ? readFileSync(requiredFiles[1], 'utf8') : '';
const pass2 = existsSync(requiredFiles[2]) ? readFileSync(requiredFiles[2], 'utf8') : '';

for (const marker of ['PASS 1', 'Read-only', 'No cost-impacting changes']) {
  if (!pass1.includes(marker)) failures.push(`PASS1 evidence missing marker: ${marker}`);
}

for (const marker of ['PASS 2', 'Implemented', 'Still owner-gated']) {
  if (!pass2.includes(marker)) failures.push(`PASS2 evidence missing marker: ${marker}`);
}

if (!readFileSync('docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md', 'utf8').includes('Pack 22')) {
  failures.push('live-app alignment missing Pack 22 note');
}

if (failures.length > 0) {
  console.error('Pack 22 verification audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pack 22 verification audit passed. (static-marker)');

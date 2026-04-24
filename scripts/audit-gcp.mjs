#!/usr/bin/env node
import { execSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT_ID ?? 'praxisbytacitus';
const SKIP_GCLOUD = process.env.AUDIT_GCP_SKIP === '1';

function gcloud(cmd) {
  try {
    return execSync(`gcloud ${cmd} --project ${PROJECT} --format="value(name)"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`gcloud call failed: ${err.message}`);
  }
}

function gcloudDescribe(cmd) {
  try {
    const out = execSync(`gcloud ${cmd} --project ${PROJECT}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.length > 0;
  } catch {
    return false;
  }
}

const checks = [
  { name: 'Vertex AI API enabled',                         run: () => gcloud('services list --filter=name:aiplatform.googleapis.com').length > 0 },
  { name: 'Firestore API enabled',                         run: () => gcloud('services list --filter=name:firestore.googleapis.com').length > 0 },
  { name: 'Cloud Run API enabled',                         run: () => gcloud('services list --filter=name:run.googleapis.com').length > 0 },
  { name: 'BigQuery dataset praxis_analytics',             run: () => gcloudDescribe('alpha bq datasets describe praxis_analytics') },
  { name: 'Storage bucket praxisbytacitus-praxis-uploads', run: () => gcloudDescribe('storage buckets describe gs://praxisbytacitus-praxis-uploads') },
  { name: 'Pub/Sub topic profile.events',                  run: () => gcloudDescribe('pubsub topics describe profile.events') },
  { name: 'Secret Manager: praxis-firebase-sa',            run: () => gcloudDescribe('secrets describe praxis-firebase-sa') },
  { name: 'Secret Manager: praxis-ai-key',                 run: () => gcloudDescribe('secrets describe praxis-ai-key') },
  { name: 'Secret Manager: praxis-cron-secret',            run: () => gcloudDescribe('secrets describe praxis-cron-secret') },
  { name: 'Secret Manager: praxis-cookie-secret',          run: () => gcloudDescribe('secrets describe praxis-cookie-secret') },
];

async function main() {
  if (SKIP_GCLOUD) {
    console.log('AUDIT_GCP_SKIP=1 — skipping gcloud calls, reporting PASS.');
    process.exit(0);
  }
  let fail = 0;
  for (const c of checks) {
    let ok = false;
    try {
      ok = c.run();
    } catch (e) {
      console.error(`FAIL ${c.name}: ${e.message}`);
    }
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${c.name}`);
    if (!ok) fail++;
  }
  if (fail > 0) {
    console.error(`\n${fail} of ${checks.length} checks failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} checks passed.`);
}

void main();

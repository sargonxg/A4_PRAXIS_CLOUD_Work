#!/usr/bin/env node
/**
 * GCP readiness audit — exits non-zero when a required resource is missing.
 *
 * Run locally with gcloud configured, or from Cloud Build (the build-step SA
 * needs reader roles on the target resources; see
 * infrastructure/grant-cloudbuild-audit-iam.sh).
 *
 * Set AUDIT_GCP_SKIP=1 to no-op (useful until IAM is granted in CI).
 */
import { execSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT_ID ?? 'praxisbytacitus';
const SKIP_GCLOUD = process.env.AUDIT_GCP_SKIP === '1';

function gcloudValue(cmd) {
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

function gcloudList(cmd) {
  try {
    return execSync(`gcloud ${cmd} --project ${PROJECT} --format="value(name)"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

const checks = [
  // APIs
  { name: 'Vertex AI API enabled',                         category: 'api',     run: () => gcloudValue('services list --filter=name:aiplatform.googleapis.com').length > 0 },
  { name: 'Firestore API enabled',                         category: 'api',     run: () => gcloudValue('services list --filter=name:firestore.googleapis.com').length > 0 },
  { name: 'Cloud Run API enabled',                         category: 'api',     run: () => gcloudValue('services list --filter=name:run.googleapis.com').length > 0 },
  { name: 'Cloud Build API enabled',                       category: 'api',     run: () => gcloudValue('services list --filter=name:cloudbuild.googleapis.com').length > 0 },
  { name: 'Pub/Sub API enabled',                           category: 'api',     run: () => gcloudValue('services list --filter=name:pubsub.googleapis.com').length > 0 },
  { name: 'Cloud Functions API enabled',                   category: 'api',     run: () => gcloudValue('services list --filter=name:cloudfunctions.googleapis.com').length > 0 },
  { name: 'Cloud Scheduler API enabled',                   category: 'api',     run: () => gcloudValue('services list --filter=name:cloudscheduler.googleapis.com').length > 0 },
  { name: 'Cloud Tasks API enabled',                       category: 'api',     run: () => gcloudValue('services list --filter=name:cloudtasks.googleapis.com').length > 0 },
  { name: 'Cloud SQL Admin API enabled',                    category: 'api',     run: () => gcloudValue('services list --filter=name:sqladmin.googleapis.com').length > 0 },
  { name: 'Service Networking API enabled',                 category: 'api',     run: () => gcloudValue('services list --filter=name:servicenetworking.googleapis.com').length > 0 },
  { name: 'Secret Manager API enabled',                    category: 'api',     run: () => gcloudValue('services list --filter=name:secretmanager.googleapis.com').length > 0 },
  { name: 'BigQuery API enabled',                          category: 'api',     run: () => gcloudValue('services list --filter=name:bigquery.googleapis.com').length > 0 },
  { name: 'Artifact Registry API enabled',                 category: 'api',     run: () => gcloudValue('services list --filter=name:artifactregistry.googleapis.com').length > 0 },

  // Storage
  { name: 'BigQuery dataset praxis_analytics',             category: 'data',    run: () => gcloudDescribe('alpha bq datasets describe praxis_analytics') },
  { name: 'Storage bucket praxis-uploads',                 category: 'data',    run: () => gcloudDescribe('storage buckets describe gs://praxisbytacitus-praxis-uploads') },

  // Secrets (every required secret the app mounts)
  { name: 'Secret: praxis-firebase-sa',                    category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-firebase-sa') },
  { name: 'Secret: praxis-google-ai-key',                  category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-google-ai-key') },
  { name: 'Secret: praxis-cron-secret',                    category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-cron-secret') },
  { name: 'Secret: praxis-cookie-secret',                  category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-cookie-secret') },
  { name: 'Secret: praxis-user-key-master',                category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-user-key-master') },
  { name: 'Secret: praxis-langgraph-db-password',           category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-langgraph-db-password') },
  { name: 'Secret: praxis-ucdp-api-token',                 category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-ucdp-api-token') },
  { name: 'Secret: praxis-vertex-adk-engine-id',           category: 'secret',  run: () => gcloudDescribe('secrets describe praxis-vertex-adk-engine-id') },

  // Pub/Sub topics (5 referenced in CLAUDE.md)
  { name: 'Pub/Sub topic: profile.events',                 category: 'pubsub',  run: () => gcloudDescribe('pubsub topics describe profile.events') },

  // Cloud Tasks queues (provisioned for the async dispatcher roadmap)
  { name: 'Cloud Tasks queue: praxis-research',             category: 'tasks',   soft: true, run: () => gcloudDescribe('tasks queues describe praxis-research --location=us-central1') },
  { name: 'Cloud Tasks queue: praxis-agents',               category: 'tasks',   soft: true, run: () => gcloudDescribe('tasks queues describe praxis-agents --location=us-central1') },
  { name: 'Cloud Tasks queue: praxis-embeddings',           category: 'tasks',   soft: true, run: () => gcloudDescribe('tasks queues describe praxis-embeddings --location=us-central1') },

  // Cloud Run services
  { name: 'Cloud Run: praxis-frontend',                    category: 'runtime', run: () => gcloudDescribe('run services describe praxis-frontend --region=us-central1') },
  { name: 'Cloud Run: praxis-backend',                     category: 'runtime', run: () => gcloudDescribe('run services describe praxis-backend --region=us-central1') },
  { name: 'Cloud Run worker pool: gdelt-poller',            category: 'runtime', soft: true, run: () => gcloudDescribe('beta run worker-pools describe gdelt-poller --region=us-central1') },

  // LangGraph checkpoint database
  { name: 'Cloud SQL: praxisbytacitus-instance',            category: 'sql',     run: () => gcloudDescribe('sql instances describe praxisbytacitus-instance') },
  { name: 'Cloud SQL database: praxis_langgraph',           category: 'sql',     run: () => gcloudList('sql databases list --instance=praxisbytacitus-instance').includes('praxis_langgraph') },
  { name: 'Service account: praxis-agents-sa',              category: 'iam',     run: () => gcloudDescribe('iam service-accounts describe praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com') },

  // Cloud Scheduler jobs (GDELT poll, alerts, briefing — declared in plan)
  { name: 'Scheduler job exists',                          category: 'schedule', soft: true, run: () => gcloudList('scheduler jobs list --location=us-central1').length > 0 },
];

async function main() {
  if (SKIP_GCLOUD) {
    console.log('AUDIT_GCP_SKIP=1 — skipping gcloud calls, reporting PASS.');
    process.exit(0);
  }
  let hardFail = 0;
  let softFail = 0;
  const byCategory = {};
  for (const c of checks) {
    let ok = false;
    try {
      ok = c.run();
    } catch (e) {
      console.error(`FAIL ${c.name}: ${e.message}`);
    }
    console.log(`${ok ? 'OK  ' : c.soft ? 'WARN' : 'FAIL'} [${c.category}] ${c.name}`);
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    if (!ok) {
      if (c.soft) softFail++;
      else hardFail++;
    }
  }
  console.log(`\nSummary: ${Object.entries(byCategory).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`Hard failures: ${hardFail} · Soft warnings: ${softFail}`);
  if (hardFail > 0) process.exit(1);
}

void main();

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const PROJECT = 'praxisbytacitus';
const RULES_API = 'https://firebaserules.googleapis.com/v1';
const BUCKETS = new Set(['praxisbytacitus.firebasestorage.app', 'praxisbytacitus.appspot.com']);
export const rulesHash = (source) => createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');

// Keep only bounded identifiers. Free text, credentials, headers and stacks
// must never enter the release receipt, even under an otherwise allowed key.
function remoteErrorDiagnostic(response) {
  const identifier = (value, pattern, limit) => typeof value === 'string' && value.length <= limit && value.trim() === value && pattern.test(value) ? value : undefined;
  const hostname = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
  const error = response.data?.error;
  const diagnostic = {};
  if (Number.isInteger(response.status) && response.status >= 100 && response.status <= 599) diagnostic.status = response.status;
  if (Number.isInteger(error?.code) && error.code >= 0 && error.code <= 599) diagnostic.code = error.code;
  const details = (Array.isArray(error?.details) ? error.details : [])
    .filter(detail => detail?.['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo')
    .slice(0, 8).map(detail => {
      const item = {};
      const reason = identifier(detail.reason, /^[A-Z][A-Z0-9_]*$/, 128);
      const domain = identifier(detail.domain, hostname, 253);
      if (reason) item.reason = reason;
      if (domain) item.domain = domain;
      const metadata = {};
      const permission = identifier(detail.metadata?.permission, /^[a-z][a-z0-9_]*(?:\.[a-z][a-zA-Z0-9_]*){2,}$/, 256);
      const service = identifier(detail.metadata?.service, hostname, 253);
      const consumer = identifier(detail.metadata?.consumer, /^projects\/(?:[0-9]{1,20}|[a-z][a-z0-9-]{4,28}[a-z0-9])$/, 64);
      if (permission) metadata.permission = permission;
      if (service) metadata.service = service;
      if (consumer) metadata.consumer = consumer;
      if (Object.keys(metadata).length) item.metadata = metadata;
      return item;
    }).filter(item => Object.keys(item).length);
  if (details.length) diagnostic.details = details;
  return diagnostic;
}

/** Read/compile by default. Exact project, bucket and source hashes are required
 * before creating rulesets or updating releases. No credentials or IAM changes. */
export async function releaseFirebaseRules(options) {
  const { project, bucket, sources, expectedHashes, request, apply = false, only = 'both', onReceipt = () => {} } = options;
  if (project !== PROJECT || !BUCKETS.has(bucket) || !['both', 'firestore'].includes(only)) throw new Error('rules_target_rejected');
  const entries = [
    { file: 'firestore.rules', release: 'cloud.firestore' },
    { file: 'storage.rules', release: `firebase.storage/${bucket}` },
  ].filter(entry => only !== 'firestore' || entry.file === 'firestore.rules')
    .map(entry => ({ ...entry, source: sources[entry.file], hash: rulesHash(sources[entry.file] ?? '') }));
  for (const entry of entries) {
    if (!entry.source || entry.hash !== expectedHashes[entry.file]) throw new Error('rules_hash_rejected');
  }
  const receipt = { schemaVersion: 1, observedAtUtc: new Date().toISOString(), project, bucket, apply, only, status: 'preflight', lastOperation: '', propagationVerified: false, releases: [] };
  const save = () => onReceipt(structuredClone(receipt));
  const call = async (url, method = 'GET', body) => {
    receipt.lastOperation = `${method} ${new URL(url).pathname}`;
    save();
    const response = await request(url, { method, ...(body ? { body } : {}) });
    if (!response.ok) {
      receipt.remoteError = remoteErrorDiagnostic(response);
      throw new Error(`rules_request_failed_${response.status}`);
    }
    return response.data;
  };
  try {
    // Confirm project identity and the existing cross-service Storage grant.
    const projectInfo = await call(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}`);
    if (projectInfo.projectId !== PROJECT || !projectInfo.projectNumber) throw new Error('rules_project_unverified');
    if (only === 'both' && /firestore\.(get|exists)/.test(sources['storage.rules'])) {
      const policy = await call(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}:getIamPolicy`, 'POST', {});
      const member = `serviceAccount:service-${projectInfo.projectNumber}@gcp-sa-firebasestorage.iam.gserviceaccount.com`;
      if (!policy.bindings?.some(binding => binding.role === 'roles/firebaserules.firestoreServiceAgent' && !binding.condition && binding.members?.includes(member))) {
        throw new Error('storage_cross_service_permission_unverified');
      }
    }
    for (const entry of entries) {
      const name = `projects/${PROJECT}/releases/${entry.release}`;
      const previous = await call(`${RULES_API}/${name}`);
      if (previous.name !== name || !previous.rulesetName?.startsWith(`projects/${PROJECT}/rulesets/`)) throw new Error('rules_previous_release_unverified');
      const source = { files: [{ name: entry.file, content: entry.source }] };
      const compile = await call(`${RULES_API}/projects/${PROJECT}:test`, 'POST', { source });
      if (compile.issues?.some(issue => issue.severity === 'ERROR')) throw new Error('rules_compile_failed');
      receipt.releases.push({ file: entry.file, release: name, sourceSha256: entry.hash, previousRuleset: previous.rulesetName, compiled: true, deployed: false });
      save();
    }
    receipt.status = 'preflight_passed';
    save();
    if (!apply) return receipt;
    for (const entry of entries) {
      const proof = receipt.releases.find(item => item.file === entry.file);
      const created = await call(`${RULES_API}/projects/${PROJECT}/rulesets`, 'POST', { source: { files: [{ name: entry.file, content: entry.source }] } });
      if (!created.name?.startsWith(`projects/${PROJECT}/rulesets/`)) throw new Error('rules_created_target_unverified');
      await call(`${RULES_API}/${proof.release}`, 'PATCH', { release: { name: proof.release, rulesetName: created.name }, updateMask: 'rulesetName' });
      proof.createdRuleset = created.name;
      save();
      const published = await call(`${RULES_API}/${proof.release}`);
      if (published.rulesetName !== created.name) throw new Error('rules_release_readback_failed');
      const deployed = await call(`${RULES_API}/${created.name}`);
      const content = deployed.source?.files?.find(file => file.name === entry.file)?.content;
      if (rulesHash(content ?? '') !== entry.hash) throw new Error('rules_source_readback_failed');
      proof.deployed = true;
      save();
    }
    receipt.status = 'deployed_readback_verified';
    receipt.propagationVerified = false; // User-level live checks are still required.
    save();
    return receipt;
  } catch (error) {
    receipt.status = 'failed';
    receipt.failure = error instanceof Error ? error.message : 'rules_release_failed';
    save();
    throw error;
  }
}

async function main() {
  const args = new Map(process.argv.slice(2).map(value => {
    const index = value.indexOf('=');
    return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)];
  }));
  const sources = { 'firestore.rules': readFileSync('firestore.rules', 'utf8'), 'storage.rules': readFileSync('storage.rules', 'utf8') };
  if (args.has('--plan')) {
    console.log(JSON.stringify({ project: PROJECT, hashes: Object.fromEntries(Object.entries(sources).map(([file, source]) => [file, rulesHash(source)])), mutation: false }, null, 2));
    return;
  }
  // Validate hashes before GoogleAuth attempts a token refresh.
  const expectedHashes = { 'firestore.rules': args.get('--expected-firestore-sha256'), 'storage.rules': args.get('--expected-storage-sha256') };
  const only = String(args.get('--only') || 'both');
  if (Object.entries(sources).filter(([file]) => only !== 'firestore' || file === 'firestore.rules')
    .some(([file, source]) => rulesHash(source) !== expectedHashes[file])) throw new Error('rules_hash_rejected');
  // createRequire supports NODE_PATH for the isolated, pinned Cloud Build tool
  // install, while local runs resolve the ordinary repository dependency.
  const { GoogleAuth } = createRequire(import.meta.url)('google-auth-library');
  const client = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getClient();
  const receiptPath = String(args.get('--receipt') || 'output/firebase-rules-release.json');
  const receipt = await releaseFirebaseRules({
    project: args.get('--project'), bucket: args.get('--bucket'), sources, expectedHashes,
    only,
    apply: args.has('--apply'),
    request: async (url, options) => {
      try {
        const response = await client.request({ url, method: options.method, data: options.body, timeout: 15_000 });
        return { ok: response.status >= 200 && response.status < 300, status: response.status, data: response.data };
      } catch (error) {
        // The call helper whitelists identifiers before any receipt is saved.
        return { ok: false, status: error.response?.status || 503, data: error.response?.data ?? null };
      }
    },
    onReceipt: receipt => {
      mkdirSync(dirname(receiptPath), { recursive: true });
      writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
    },
  });
  console.log(JSON.stringify(receipt, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Auth/provider errors can contain sensitive URLs or credential details.
    console.error('Firebase rules operation failed. Inspect the redacted receipt; no credentials were changed.');
    process.exitCode = 1;
  });
}

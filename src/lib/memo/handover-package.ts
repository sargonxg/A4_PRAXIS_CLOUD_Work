import { createHash } from 'node:crypto';
import { isCurrentMemoHumanApproval, type MemoHumanApproval } from '@/lib/memo/human-review';

export interface HandoverDependency {
  id: string;
  kind: 'document' | 'source' | 'core' | 'source-receipt';
  label: string;
  reason: string;
}

export interface HandoverPreview {
  schemaVersion: 1;
  previewHash: string;
  mode: 'draft' | 'human-reviewed';
  memoId: string;
  memoVersionId: string;
  bodyHash: string;
  capsule: {
    capsuleId: string | null;
    requestedVersion: number | null;
    resolvedVersion: number | null;
    status: 'pinned' | 'none';
    label?: string;
    purpose?: string;
    claimCount?: number;
    sourceCount?: number;
  };
  files: string[];
  included: string[];
  omitted: string[];
  unresolvedDependencies: HandoverDependency[];
  warnings: string[];
  review: {
    status: 'draft' | 'human-reviewed';
    intendedUse: MemoHumanApproval['intendedUse'] | null;
    approvedAt: string | null;
    limitations: string;
  };
}

export interface HandoverInput {
  ownerUid: string;
  memoId: string;
  memoVersionId: string;
  title: string;
  body: string;
  capsuleId: string | null;
  capsuleVersion: number | null;
  capsule: unknown;
  sourceReceipts: unknown[];
  sourceReceiptIds: string[];
  caseId?: string | null;
  pathId?: string | null;
  /** Only the server's signature verifier may supply this value. */
  verifiedApproval: MemoHumanApproval | null;
}

export interface HandoverPlan {
  preview: HandoverPreview;
  markdown: string;
  readme: string;
  capsuleSnapshot: Record<string, unknown>;
  sources: Array<Record<string, unknown>>;
  contextManifest: Record<string, unknown>;
}

export class HandoverConflictError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'HandoverConflictError';
  }
}

const FILES = ['README.md', 'memo.md', 'memo.docx', 'memo.pdf', 'capsule-snapshot.json',
  'capsule-snapshot.pdf', 'receipt-ledger.csv', 'source-receipts.json', 'path-manifest.json', 'integrity-manifest.json'];
const MAX_ROWS = 100;

/** A deliberate export projection: private notes, raw payloads and permissions never pass through. */
export function createHandoverPlan(input: HandoverInput): HandoverPlan {
  const body = input.body.replace(/\r\n/g, '\n').trim();
  if (!input.memoId || !input.memoVersionId || !body) {
    throw new HandoverConflictError('saved_memo_required', 'Save a non-empty memo version before preparing a handover.');
  }
  if (body.length > 300_000) throw new HandoverConflictError('memo_too_large', 'This memo exceeds the handover size limit.');
  const bodyHash = sha256(body);
  const approval = input.verifiedApproval;
  const reviewed = approval?.reviewerUid === input.ownerUid && isCurrentMemoHumanApproval(approval, {
    memoId: input.memoId, versionId: input.memoVersionId, bodyHash,
  });
  const review: HandoverPreview['review'] = reviewed && approval ? {
    status: 'human-reviewed', intendedUse: approval.intendedUse, approvedAt: approval.approvedAt,
    limitations: approval.limitations || 'No additional limitations recorded by the reviewer.',
  } : {
    status: 'draft', intendedUse: null, approvedAt: null,
    limitations: 'Draft: no valid human approval of this exact saved body/version is recorded. Review the claims and original sources before use.',
  };
  const omitted = ['Private notes and tacit knowledge, hidden reasoning, account identifiers and access policies.',
    'Original source files, source excerpts, raw model/tool payloads and authorization credentials.',
    'Source ownership, sharing permissions and agent execution authority are not transferred.',
    'Metadata is bounded: source titles/publishers/locators to 1,000 characters; capsule purpose/summary/claims to 8,000; method and boundary entries to 4,000.',
    'PDF/Word are plain-text renditions: Markdown remains the authoritative saved text. PDF standard fonts may not preserve all scripts; original rich layout is not bundled.'];
  const unresolvedDependencies: HandoverDependency[] = [];
  const warnings = ['File hashes check integrity against the manifest; they do not authenticate the sender or verify analytical correctness.',
    'The download link grants temporary bearer access to this package. Link expiry does not delete the stored package or a recipient’s copy.',
    'Review the saved memo and selected context for sensitive text before sharing. Excluding structured private fields does not automatically redact secrets written into prose.'];
  if (!reviewed) warnings.push('This is a draft handover. A saved “final” label or an automated check cannot approve it.');

  let capsuleSnapshot: Record<string, unknown> = { schemaVersion: 1, capsuleId: null, capsuleVersion: null, status: 'no-capsule' };
  let capsulePreview: HandoverPreview['capsule'] = { capsuleId: null, requestedVersion: null, resolvedVersion: null, status: 'none' };
  if (input.capsuleId) {
    const capsule = record(input.capsule);
    if (!Number.isSafeInteger(input.capsuleVersion) || (input.capsuleVersion ?? 0) < 1
      || capsule.capsuleId !== input.capsuleId || capsule.version !== input.capsuleVersion
      || capsule.ownerUid !== input.ownerUid) {
      throw new HandoverConflictError('capsule_version_unavailable', 'The exact owner-scoped capsule version used by this memo is unavailable. Reopen and save with the intended context; newer context will not be substituted.');
    }
    const projection = projectCapsule(capsule, omitted, unresolvedDependencies);
    capsuleSnapshot = projection;
    capsulePreview = { capsuleId: input.capsuleId, requestedVersion: input.capsuleVersion,
      resolvedVersion: input.capsuleVersion, status: 'pinned', label: String(projection.label),
      purpose: String(projection.purpose), claimCount: (projection.claims as unknown[]).length,
      sourceCount: (projection.sources as unknown[]).length };
    warnings.push('The capsule is a pinned context snapshot, not a certificate that its claims are true. Imported review assertions require the recipient’s own review.');
  }
  const sources = projectSources(input.sourceReceipts, omitted);
  for (const source of sources) addSourceDependency(source, unresolvedDependencies);
  if (input.sourceReceiptIds.length > 500) omitted.push(`${input.sourceReceiptIds.length - 500} additional memo source references omitted by the 500-reference limit.`);
  for (const id of input.sourceReceiptIds.slice(0, 500)) {
    if (!sources.some((source) => source.id === id)) unresolvedDependencies.push({ id, kind: 'source-receipt',
      label: id, reason: 'The memo names this receipt, but no exportable receipt metadata is present.' });
  }
  const included = ['Exact saved memo body and its version/hash; draft or body-bound human-review scope and limitations.',
    'Sanitized source metadata and unresolved dependency inventory.',
    ...(input.capsuleId ? ['Pinned capsule purpose, scope, claim statements/caveats, source references, public method and agent boundaries.'] : ['An explicit no-capsule marker.']),
    'Readable handover guide and a SHA-256 file-integrity manifest.'];
  const contextManifest = { schemaVersion: 1, memoId: input.memoId, memoVersionId: input.memoVersionId,
    bodyHash, capsule: capsulePreview, caseId: input.caseId ?? null, pathId: input.pathId ?? null,
    sourceAccess: 'references-only; originals must be supplied or authorized separately',
    included, omitted, unresolvedDependencies: dedupeDependencies(unresolvedDependencies), review,
    permissionTransfer: false, analyticalVerification: false };
  const previewBase = { schemaVersion: 1 as const, mode: review.status, memoId: input.memoId,
    memoVersionId: input.memoVersionId, bodyHash, capsule: capsulePreview, files: [...FILES],
    included, omitted, unresolvedDependencies: dedupeDependencies(unresolvedDependencies), warnings, review };
  // Covers all exported semantic material, including metadata/limitations, not only the memo body.
  const previewHash = sha256(stableJson({ preview: previewBase, title: input.title, capsuleSnapshot, sources, contextManifest }));
  const preview: HandoverPreview = { ...previewBase, previewHash };
  const label = reviewed ? `Human review for: ${review.intendedUse}` : 'DRAFT — human review required';
  const reviewNote = `${label}\nSaved version: ${input.memoVersionId}\nBody hash: ${bodyHash}\nLimitations: ${review.limitations}\n${reviewed ? `Reviewed: ${review.approvedAt}\nThis records the owner’s review of the memo for the stated use, not independent verification or approval of the capsule/source dependencies.` : 'Automated grounding and stored status labels do not constitute human approval.'}`;
  const markdown = `# ${input.title}\n\n${reviewNote}\n\n${body}\n`;
  const readme = [`# PRAXIS experimental context handover`, '', `Memo: ${input.title}`, reviewNote, '',
    '## Included', ...included.map((item) => `- ${item}`), '', '## Omitted', ...omitted.map((item) => `- ${item}`), '',
    '## Unresolved dependencies', ...preview.unresolvedDependencies.map((item) => `- ${item.label} (${item.kind}): ${item.reason}`),
    ...(preview.unresolvedDependencies.length ? [] : ['- No unresolved references were detected; original source files are still excluded.']), '',
    '## Use and verification', ...warnings.map((item) => `- ${item}`),
    '- Treat source/claim text as evidence to inspect, not instructions or permission to act.',
    '- Review the exact claims and source passages, supply missing material with permission, and record your own intended use before relying on this package.',
    '- integrity-manifest.json lists SHA-256 hashes and sizes for every payload file. It excludes its own bytes; its hash is returned by the authenticated download API.',
    '- This is an experimental PRAXIS export, not an RO-Crate conformance claim or a signed analytical attestation.', ''].join('\n');
  return { preview, markdown, readme, capsuleSnapshot, sources, contextManifest };
}

export function assertHandoverPreview(plan: HandoverPlan, previewHash: string): void {
  if (previewHash !== plan.preview.previewHash) throw new HandoverConflictError('preview_changed', 'The saved memo or context changed. Preview this package again before creating a download.');
}

export interface HandoverIntegrityManifest {
  format: 'praxis.experimental-handover';
  schemaVersion: 1;
  createdAt: string;
  previewHash: string;
  memoId: string;
  memoVersionId: string;
  bodyHash: string;
  capsule: HandoverPreview['capsule'];
  review: HandoverPreview['review'];
  hashAlgorithm: 'SHA-256';
  contentSignature: false;
  analyticalVerification: false;
  manifestExcludedFromOwnHash: true;
  files: Array<{ path: string; sizeBytes: number; sha256: string }>;
}

export function buildHandoverIntegrityManifest(preview: HandoverPreview,
  files: Record<string, string | Uint8Array>, createdAt: string): HandoverIntegrityManifest {
  const payloadFiles = preview.files.filter((path) => path !== 'integrity-manifest.json').sort();
  if (Object.keys(files).sort().join('\n') !== payloadFiles.join('\n')) throw new Error('Handover payload files do not match the preview.');
  return { format: 'praxis.experimental-handover', schemaVersion: 1, createdAt, previewHash: preview.previewHash,
    memoId: preview.memoId, memoVersionId: preview.memoVersionId, bodyHash: preview.bodyHash,
    capsule: preview.capsule, review: preview.review, hashAlgorithm: 'SHA-256', contentSignature: false,
    analyticalVerification: false, manifestExcludedFromOwnHash: true,
    files: payloadFiles.map((path) => { const bytes = toBytes(files[path]); return { path, sizeBytes: bytes.byteLength, sha256: sha256(bytes) }; }) };
}

/** Checks bytes against a supplied manifest; not sender authentication or a trust decision. */
export function verifyHandoverIntegrity(manifest: unknown,
  files: Record<string, string | Uint8Array>): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const input = record(manifest);
  if (input.format !== 'praxis.experimental-handover' || input.schemaVersion !== 1 || input.hashAlgorithm !== 'SHA-256'
    || !Array.isArray(input.files)) return { valid: false, issues: ['Unsupported or malformed manifest format.'] };
  const entries = input.files.map(record);
  const paths = entries.map((file) => typeof file.path === 'string' ? file.path : '');
  if (new Set(paths).size !== paths.length) issues.push('Duplicate payload paths.');
  const requiredPaths = FILES.filter((path) => path !== 'integrity-manifest.json').sort();
  if ([...paths].sort().join('\n') !== requiredPaths.join('\n')) issues.push('Incomplete or unexpected manifest payload inventory.');
  for (const file of entries) {
    if (typeof file.path !== 'string' || !requiredPaths.includes(file.path)) { issues.push('Unexpected payload path.'); continue; }
    if (!Number.isSafeInteger(file.sizeBytes) || Number(file.sizeBytes) < 0
      || typeof file.sha256 !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(file.sha256)) { issues.push('Malformed payload integrity record.'); continue; }
    const value = files[file.path];
    if (value === undefined) { issues.push(`Missing payload: ${file.path}`); continue; }
    const bytes = toBytes(value);
    if (bytes.byteLength !== file.sizeBytes || sha256(bytes) !== file.sha256) issues.push(`Integrity mismatch: ${file.path}`);
  }
  if (Object.keys(files).some((path) => !paths.includes(path))) issues.push('Unlisted payload file.');
  return { valid: issues.length === 0, issues };
}

export function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function projectCapsule(capsule: Record<string, unknown>, omitted: string[], dependencies: HandoverDependency[]): Record<string, unknown> {
  const v3 = record(capsule.v3);
  const use = record(v3.businessUseCase);
  const ledger = record(v3.claimLedger);
  const grounding = record(v3.grounding);
  const temporality = record(capsule.temporality ?? grounding.temporality);
  const method = record(v3.reasoningScaffold);
  const contract = record(v3.agentOperatingContract);
  const claimRows = Array.isArray(capsule.claimLedger) ? capsule.claimLedger : rows(ledger.allClaims);
  const privateClaimCount = claimRows.slice(0, MAX_ROWS).filter(privateRow).length;
  if (privateClaimCount) omitted.push(`${privateClaimCount} claim(s) explicitly marked private or confidential.`);
  const claims = boundedRows(claimRows, 'Capsule claims', omitted).filter((item) => !privateRow(item)).map((item) => {
    const claim = record(item);
    const fullText = claim.text ?? claim.statement;
    const textTruncated = typeof fullText === 'string' && fullText.trim().length > 8000;
    if (textTruncated) omitted.push(`Claim ${text(claim.claimId ?? claim.id, 240) || 'without id'}: text after 8,000 characters omitted; inspect its original statement.`);
    return { id: text(claim.claimId ?? claim.id, 240), text: text(claim.text ?? claim.statement, 8000),
      status: text(claim.status ?? claim.supportState ?? claim.reviewState, 100) || 'unverified',
      confidenceKind: text(claim.confidenceKind, 100) || null, caveat: text(claim.caveat, 4000),
      sourceReceiptIds: strings(claim.sourceReceiptIds ?? claim.sourceIds ?? claim.evidenceRefs, 100),
      textTruncated, sourceSupportVerified: false };
  });
  const sources = projectSources(rows(capsule.sourceRefs), omitted);
  for (const source of sources) addSourceDependency(source, dependencies);
  const refs = record(capsule.coreRefs);
  for (const id of strings(refs.documentCoreIds, 500)) dependencies.push({ id, kind: 'document', label: id,
    reason: 'Owner-scoped document reference only. Its original file and access permissions are not included.' });
  for (const id of strings(refs.sourceCoreIds, 500)) dependencies.push({ id, kind: 'source', label: id,
    reason: 'Owner-scoped source reference only. The recipient must obtain authorized evidence separately.' });
  for (const key of ['userCoreId', 'situationCoreId', 'graphCoreId', 'timeCoreId', 'memoryCoreId']) {
    const id = text(refs[key], 240);
    if (id) dependencies.push({ id, kind: 'core', label: `${key}: ${id}`, reason: 'Reference only; the corresponding owner-scoped core is not bundled or authorized.' });
  }
  const exportableReceiptIds = new Set(sources.map((source) => source.id));
  for (const claim of claims) for (const id of claim.sourceReceiptIds) {
    if (!exportableReceiptIds.has(id)) dependencies.push({ id, kind: 'source-receipt', label: id,
      reason: 'A capsule claim references this receipt; its source metadata/passage is not bundled.' });
  }
  return { schemaVersion: 1, sourceSchemaVersion: typeof capsule.schemaVersion === 'number' ? capsule.schemaVersion : null, capsuleId: capsule.capsuleId,
    capsuleVersion: capsule.version, label: text(capsule.label, 1000), summary: text(capsule.summary, 8000),
    scope: text(capsule.scope, 1000), purpose: text(capsule.purpose ?? use.purpose, 8000),
    useCase: text(capsule.useCase ?? use.useCase, 8000), asOf: text(temporality.asOf, 100) || null,
    validFrom: text(temporality.validFrom, 100) || null, validUntil: text(temporality.validUntil, 100) || null,
    claims, sources, publicMethod: strings(method.publicMethod, 30), caveats: strings(method.caveats, 30),
    agentBoundaries: { forbiddenActions: strings(contract.forbiddenActions, 30),
      stopConditions: strings(contract.stopConditions, 30), outputRestrictions: strings(contract.outputRestrictions, 30),
      authorityTransferred: false }, reviewRequiredOnImport: true, permissionTransfer: false };
}

function projectSources(input: unknown[], omitted: string[]): Array<Record<string, unknown>> {
  const bounded = boundedRows(input, 'Source receipts', omitted);
  const privateCount = bounded.filter(privateRow).length;
  if (privateCount) omitted.push(`${privateCount} source receipt(s) explicitly marked private or confidential.`);
  return bounded.filter((item) => !privateRow(item)).map((item, index) => {
    const source = record(item);
    return { id: text(source.id ?? source.receiptId ?? source.sourceReceiptId ?? source.sourceId, 240) || `source-${index + 1}`,
      title: text(source.title ?? source.name ?? source.label, 1000), publisher: text(source.publisher, 1000),
      url: safeSourceUrl(source.finalUrl ?? source.url ?? source.originalUrl ?? source.sourceUrl),
      capturedAt: text(source.capturedAt ?? source.retrievedAt ?? source.collectedAt, 100) || null,
      publishedAt: text(source.publishedAt ?? source.date, 100) || null,
      locator: text(source.locator ?? source.pageLabel ?? source.section, 1000),
      originalPassageStatus: text(source.originalPassageStatus, 100) || 'unverified',
      originalPassageIncluded: false, claimSupportVerified: false,
      license: text(source.license, 1000) || 'Reuse rights not established by this export.' };
  });
}

function addSourceDependency(source: Record<string, unknown>, dependencies: HandoverDependency[]) {
  dependencies.push({ id: String(source.id), kind: 'source', label: String(source.title || source.id),
    reason: 'Only source metadata is bundled. Retrieve or supply the original passage/file with permission and review its support for the claim.' });
}

function boundedRows(input: unknown[], label: string, omitted: string[]): unknown[] {
  if (input.length > MAX_ROWS) omitted.push(`${label}: ${input.length - MAX_ROWS} additional rows omitted by the ${MAX_ROWS}-row package limit.`);
  return input.slice(0, MAX_ROWS);
}

function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || /(^localhost$|\.internal$|^127\.|^\[::1\]$)/i.test(url.hostname)
      || /(^|[?&])(token|signature|key|auth|credential|password|x-amz[^=]*|x-goog[^=]*)=/i.test(url.search)) return null;
    url.search = ''; url.hash = '';
    return url.href;
  } catch { return null; }
}

function privateRow(value: unknown): boolean {
  const item = record(value);
  return item.private === true || item.visibility === 'private' || ['private', 'confidential', 'restricted'].includes(String(item.sensitivity));
}

function dedupeDependencies(input: HandoverDependency[]): HandoverDependency[] {
  return Array.from(new Map(input.map((item) => [`${item.kind}:${item.id}`, item])).values());
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function rows(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown, max: number): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function strings(value: unknown, max: number): string[] { return rows(value).filter((item): item is string => typeof item === 'string').slice(0, max).map((item) => item.slice(0, 4000)); }
function toBytes(value: string | Uint8Array): Uint8Array { return typeof value === 'string' ? new TextEncoder().encode(value) : value; }
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

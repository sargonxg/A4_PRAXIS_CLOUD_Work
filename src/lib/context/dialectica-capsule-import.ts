import type JSZip from 'jszip';
import { readImportZip } from '@/lib/package-zip';
import { z } from 'zod';
import { getModelIdForTask } from '@/lib/ai/model-matrix';
import { buildLadybugProjectionFromGraphJsonLd } from '@/lib/context/ladybug-projection';
import type { CreateCapsuleInput } from '@/lib/context/capsule-service';
import type {
  ContextCapsuleClaim,
  ContextCapsuleSourceRef,
  EvidenceReceipt,
} from '@/lib/context/capsule-v2';

export const DIALECTICA_CAPSULE_MIMETYPE = 'application/vnd.tacitus.praxis-capsule+zip';
export const DIALECTICA_MAX_CLAIMS = 5000;
export const DIALECTICA_KNOWN_LAYERS = [
  'evidence',
  'claims',
  'situation',
  'temporal',
  'ontology',
  'reasoning',
  'governance',
  'runtime',
] as const;

const KNOWN_LAYER_SET = new Set<string>(DIALECTICA_KNOWN_LAYERS);

type DialecticaGraphGeneratedBy = {
  actorType: 'model';
  actorId: string;
  at: string;
  activity: 'import';
};

export interface DialecticaFieldError {
  field: string;
  message: string;
}

export class DialecticaCapsuleImportError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: DialecticaFieldError[] = [],
    public readonly status = 400,
    public readonly importNotes: string[] = [],
  ) {
    super(message);
    this.name = 'DialecticaCapsuleImportError';
  }
}

const RequiredString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

const ManifestSchemaBase = z.object({
  capsule_id: RequiredString('capsule_id'),
  spec_version: RequiredString('spec_version'),
  version: z.number().int('version must be an integer').positive('version must be greater than 0'),
  type: RequiredString('type'),
  category: RequiredString('category'),
  title: RequiredString('title'),
  owner_uid: RequiredString('owner_uid'),
  situation_id: RequiredString('situation_id'),
  cores: z.array(RequiredString('cores[]')),
  created_at: RequiredString('created_at'),
  updated_at: RequiredString('updated_at'),
  provenance_root_hash: RequiredString('provenance_root_hash')
    .refine((value) => value.startsWith('sha256:'), 'provenance_root_hash must start with "sha256:".'),
  signature: z.unknown().refine((value) => value !== undefined && value !== null, 'signature is required'),
  depends_on: z.array(RequiredString('depends_on[]')),
  layers_present: z.array(RequiredString('layers_present[]')),
}).strict();

export const DialecticaManifestSchema = ManifestSchemaBase.superRefine((manifest, ctx) => {
  if (!/^3\.\d+$/.test(manifest.spec_version)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['spec_version'],
      message: `spec_version must match 3.x; found "${manifest.spec_version}".`,
    });
  }
});

export type DialecticaManifest = z.infer<typeof ManifestSchemaBase>;

export interface DialecticaCapsuleParts {
  manifest: unknown;
  claimsJsonl?: string | null;
  sourcesJsonl?: string | null;
  episodesJson?: unknown;
  runtimeJson?: unknown;
  graphJsonld?: unknown;
  agentContextMd?: string | null;
  operationsMd?: string | null;
  mimetype?: string | null;
  hasLadybugProjection?: boolean;
}

export interface DialecticaParsedCapsulePackage {
  manifest: DialecticaManifest;
  claims: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  episodes: Record<string, unknown>[];
  runtime: unknown;
  graphJsonld: unknown;
  agentContextMd: string;
  operationsMd: string;
  mimetype: string | null;
  layersPresent: string[];
  layersMissing: string[];
  layersBuilt: string[];
  layersSkipped: string[];
  unknownLayers: string[];
  importNotes: string[];
  contentHashInput: string;
}

export interface DialecticaCapsuleImportPreview {
  kind: 'dialectica';
  packageId: string;
  title: string;
  factCount: number;
  conflictingCount: number;
  evidenceGapCount: number;
  sourceReceiptCount: number;
  sourceReceipts: Array<{
    id: string;
    title: string;
    url?: string;
    citation?: string;
    excerpt?: string;
  }>;
  reviewGatedSummary: string;
  specVersion: string;
  layersPresent: string[];
  layersMissing: string[];
  layersBuilt: string[];
  layersSkipped: string[];
  unknownLayers: string[];
  claimCount: number;
  sourceCount: number;
  signaturePresent: boolean;
  importNotes: string[];
  fieldErrors?: DialecticaFieldError[];
}

export interface DialecticaCapsuleImportPlan {
  manifest: DialecticaManifest;
  capsuleInput: DialecticaImportedCapsuleInput;
  preview: DialecticaCapsuleImportPreview;
  reviewPatch: {
    sourceRefs: ContextCapsuleSourceRef[];
    claimLedger: ContextCapsuleClaim[];
    temporality?: Record<string, unknown>;
    ontologyBinding?: Record<string, unknown>;
    embeddedGraph?: Record<string, unknown>;
  };
  importNotes: string[];
  proposedRowsRetainedForReview: number;
}

export type DialecticaImportedCapsuleInput = CreateCapsuleInput & {
  capsuleId: string;
  importSource: 'dialectica';
  originalCapsuleId: string;
  packageVersion: number;
  importContentHash: string;
};

export function parseDialecticaManifest(input: unknown): DialecticaManifest {
  const parsed = DialecticaManifestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = zodFieldErrors(parsed.error);
    const specVersion = isRecord(input) ? stringOrNull(input.spec_version) : null;
    if (specVersion && !/^3\.\d+$/.test(specVersion) && !fieldErrors.some((error) => error.field === 'spec_version')) {
      fieldErrors.unshift({
        field: 'spec_version',
        message: `spec_version must match 3.x; found "${specVersion}".`,
      });
    }
    throw new DialecticaCapsuleImportError(
      'DIALECTICA manifest validation failed.',
      fieldErrors,
    );
  }
  return parsed.data;
}

export function parseDialecticaCapsulePackageFromParts(parts: DialecticaCapsuleParts): DialecticaParsedCapsulePackage {
  const manifest = parseDialecticaManifest(parts.manifest);
  const importNotes: string[] = [];
  const layersPresent = uniqueStrings(manifest.layers_present);
  const unknownLayers = layersPresent.filter((layer) => !KNOWN_LAYER_SET.has(layer));
  const layersMissing = DIALECTICA_KNOWN_LAYERS.filter((layer) => !layersPresent.includes(layer));
  const hasGraphJsonLd = parts.graphJsonld !== undefined && parts.graphJsonld !== null;
  const layersBuilt = hasGraphJsonLd ? ['graph/ladybug/*'] : [];
  const layersSkipped = parts.hasLadybugProjection && !hasGraphJsonLd ? ['graph/ladybug/*'] : [];
  const mimetype = stringOrNull(parts.mimetype);

  if (mimetype && mimetype !== DIALECTICA_CAPSULE_MIMETYPE) {
    throw new DialecticaCapsuleImportError('DIALECTICA capsule mimetype is not supported.', [{
      field: 'mimetype',
      message: `mimetype must be ${DIALECTICA_CAPSULE_MIMETYPE}; found "${mimetype}".`,
    }]);
  }

  if (unknownLayers.length) {
    importNotes.push(`Unknown DIALECTICA layers tolerated but not mapped: ${unknownLayers.join(', ')}.`);
  }
  if (layersMissing.length) {
    importNotes.push(`DIALECTICA layers not present in package: ${layersMissing.join(', ')}.`);
  }
  if (hasGraphJsonLd) {
    importNotes.push('Built graph/ladybug/* advisory projection from graph.jsonld; .lbug artifacts remain read-only/rebuildable and are not imported as canonical data.');
  } else if (parts.hasLadybugProjection) {
    importNotes.push('Skipped graph/ladybug/* binary projection; graph.jsonld missing so the deterministic advisory projection could not be rebuilt.');
  } else {
    importNotes.push('No graph/ladybug/* binary projection was present; no Ladybug projection layer was rebuilt.');
  }
  importNotes.push(`DIALECTICA manifest owner_uid "${manifest.owner_uid}" recorded as provenance only; PRAXIS owner is the importing user.`);

  if (layersPresent.includes('claims') && !stringOrNull(parts.claimsJsonl)) {
    throw new DialecticaCapsuleImportError('DIALECTICA claims layer is declared but claims.jsonl is missing.', [{
      field: 'claims.jsonl',
      message: 'claims.jsonl is required when layers_present includes "claims".',
    }], 400, importNotes);
  }
  if (layersPresent.includes('evidence') && !stringOrNull(parts.sourcesJsonl)) {
    throw new DialecticaCapsuleImportError('DIALECTICA evidence layer is declared but evidence/sources.jsonl is missing.', [{
      field: 'evidence/sources.jsonl',
      message: 'evidence/sources.jsonl is required when layers_present includes "evidence".',
    }], 400, importNotes);
  }

  const claims = parseJsonlRecords(parts.claimsJsonl ?? '', 'claims.jsonl', DIALECTICA_MAX_CLAIMS, importNotes);
  const sources = parseJsonlRecords(parts.sourcesJsonl ?? '', 'evidence/sources.jsonl', Number.MAX_SAFE_INTEGER, importNotes);
  const episodes = normalizeEpisodes(parts.episodesJson, importNotes, layersPresent);

  if (!parts.runtimeJson) {
    importNotes.push('runtime.json missing; runtime policy metadata was not mapped.');
  }
  if (!parts.agentContextMd) {
    importNotes.push('agent_context.md missing; agent context prose was not mapped.');
  }
  if (!parts.operationsMd) {
    importNotes.push('operations.md missing; operations prose was not mapped.');
  }
  if (parts.runtimeJson || parts.agentContextMd || parts.operationsMd) {
    importNotes.push('runtime.json, agent_context.md, and operations.md are auxiliary DIALECTICA package files; PRAXIS records their presence but does not promote them into canonical capsule fields in this slice.');
  }

  const parsedPackage: DialecticaParsedCapsulePackage = {
    manifest,
    claims,
    sources,
    episodes,
    runtime: parts.runtimeJson ?? null,
    graphJsonld: parts.graphJsonld ?? null,
    agentContextMd: stringOrNull(parts.agentContextMd) ?? '',
    operationsMd: stringOrNull(parts.operationsMd) ?? '',
    mimetype,
    layersPresent,
    layersMissing,
    layersBuilt,
    layersSkipped,
    unknownLayers,
    importNotes: uniqueStrings(importNotes),
    contentHashInput: '',
  };

  parsedPackage.contentHashInput = JSON.stringify({
    manifest: parsedPackage.manifest,
    claims: parsedPackage.claims,
    sources: parsedPackage.sources,
    episodes: parsedPackage.episodes,
    runtime: parsedPackage.runtime,
    graphJsonld: parsedPackage.graphJsonld,
    agentContextMd: parsedPackage.agentContextMd,
    operationsMd: parsedPackage.operationsMd,
  });
  return parsedPackage;
}

export async function parseDialecticaCapsuleZip(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<DialecticaParsedCapsulePackage> {
  let zip: JSZip;
  try {
    zip = await readImportZip(buffer);
  } catch (error) {
    throw new DialecticaCapsuleImportError('DIALECTICA capsule package must be a readable zip archive. Unsafe paths or exceeded byte budgets are rejected.', [{
      field: 'package',
      message: error instanceof Error ? error.message : 'Package must be a readable zip archive.',
    }]);
  }
  const hasLadybugProjection = Object.keys(zip.files).some((path) => path.startsWith('graph/ladybug/'));
  return parseDialecticaCapsulePackageFromParts({
    mimetype: await optionalZipText(zip, 'mimetype'),
    manifest: await requiredZipJson(zip, 'manifest.json'),
    claimsJsonl: await optionalZipText(zip, 'claims.jsonl'),
    sourcesJsonl: await optionalZipText(zip, 'evidence/sources.jsonl'),
    episodesJson: await optionalZipJson(zip, 'episodes.json'),
    runtimeJson: await optionalZipJson(zip, 'runtime.json'),
    graphJsonld: await optionalZipJson(zip, 'graph.jsonld'),
    agentContextMd: await optionalZipText(zip, 'agent_context.md'),
    operationsMd: await optionalZipText(zip, 'operations.md'),
    hasLadybugProjection,
  });
}

export function buildDialecticaCapsuleImportPreview(pkg: DialecticaParsedCapsulePackage): DialecticaCapsuleImportPreview {
  const sourceReceipts = pkg.sources.map((source) => {
    const id = sourceIdOf(source) ?? 'source';
    const url = stringOrNull(source.uri) ?? stringOrNull(source.url) ?? undefined;
    const publisher = stringOrNull(source.publisher) ?? stringOrNull(source.citation);
    return {
      id,
      title: stringOrNull(source.title) ?? stringOrNull(source.label) ?? id,
      ...(url ? { url } : {}),
      ...(publisher ? { citation: publisher } : {}),
      ...(stringOrNull(source.excerpt) ? { excerpt: stringOrNull(source.excerpt)! } : {}),
    };
  });

  return {
    kind: 'dialectica',
    packageId: pkg.manifest.capsule_id,
    title: pkg.manifest.title,
    factCount: pkg.claims.length,
    conflictingCount: pkg.claims.filter((claim) => claim.disputed === true).length,
    evidenceGapCount: 0,
    sourceReceiptCount: sourceReceipts.length,
    sourceReceipts,
    reviewGatedSummary: 'DIALECTICA claims, sources, timeline anchors, and advisory graph projection stay review-visible after import; binary Ladybug artifacts are never canonical data.',
    specVersion: pkg.manifest.spec_version,
    layersPresent: [...pkg.layersPresent],
    layersMissing: [...pkg.layersMissing],
    layersBuilt: [...pkg.layersBuilt],
    layersSkipped: [...pkg.layersSkipped],
    unknownLayers: [...pkg.unknownLayers],
    claimCount: pkg.claims.length,
    sourceCount: pkg.sources.length,
    signaturePresent: pkg.manifest.signature !== undefined && pkg.manifest.signature !== null,
    importNotes: [...pkg.importNotes],
  };
}

export function buildDialecticaCapsuleImportPlan(
  pkg: DialecticaParsedCapsulePackage,
  options: {
    ownerUid: string;
    importedAt: string;
    importContentHash: string;
  },
): DialecticaCapsuleImportPlan {
  const sourceRefs = mapSources(pkg.sources);
  const sourceById = new Map(sourceRefs.map((source) => [source.sourceId, source]));
  const claimLedger = pkg.claims.map((claim, index) => mapClaim(claim, index, sourceById));
  const importNotes = [...pkg.importNotes];
  const temporality = mapEpisodes(pkg.episodes, importNotes);
  const ontologyBinding = mapOntologyBinding(pkg);
  const embeddedGraph = mapGraphJsonLd(pkg.graphJsonld, pkg.manifest.capsule_id, importNotes, options.importedAt);
  const sourceCoreIds = sourceRefs.map((source) => source.sourceId);
  const capsuleId = dialecticaCapsuleId(pkg.manifest.capsule_id, pkg.manifest.version);
  const summary = `DIALECTICA spec ${pkg.manifest.spec_version} ${pkg.manifest.type} package imported with ${claimLedger.length} claim${claimLedger.length === 1 ? '' : 's'} and ${sourceRefs.length} source${sourceRefs.length === 1 ? '' : 's'}. Signature verification is out of scope for this import.`;

  const capsuleInput: DialecticaImportedCapsuleInput = {
    capsuleId,
    label: pkg.manifest.title,
    summary,
    scope: 'situation',
    coreRefs: {
      situationCoreId: pkg.manifest.situation_id,
      sourceCoreIds,
      graphCoreId: embeddedGraph ? `graph:${pkg.manifest.capsule_id}` : null,
      timeCoreId: temporality ? `temporal:${pkg.manifest.capsule_id}` : null,
      toolCoreIds: pkg.manifest.cores.filter((core) => core !== 'aco'),
    },
    sourceRefs,
    claimLedger,
    sourcePosture: {
      posture: sourceRefs.length ? 'source_backed' : 'needs_sources',
      requiredSourceTypes: ['dialectica:evidence/sources.jsonl'],
      freshnessWindowDays: 90,
      notes: 'Imported from DIALECTICA spec-3.0 capsule evidence layer.',
    },
    temporality,
    ontologyBinding,
    embeddedGraph,
    community: {
      tags: ['dialectica', 'verified-context', 'imported', `type:${pkg.manifest.type}`, `domain:${pkg.manifest.category}`],
    },
    provenance: {
      source: 'api',
      createdBy: options.ownerUid,
      parentCapsuleId: pkg.manifest.capsule_id,
      forkedFromVersion: pkg.manifest.version,
      notes: `Imported from DIALECTICA capsule ${pkg.manifest.capsule_id} spec ${pkg.manifest.spec_version}; DIALECTICA owner_uid ${pkg.manifest.owner_uid}.`,
    },
    importSource: 'dialectica',
    originalCapsuleId: pkg.manifest.capsule_id,
    packageVersion: pkg.manifest.version,
    provenance_root_hash: pkg.manifest.provenance_root_hash,
    signature: pkg.manifest.signature,
    importedAt: options.importedAt,
    importContentHash: options.importContentHash,
    importNotes: uniqueStrings(importNotes),
    dialecticaManifestOwnerUid: pkg.manifest.owner_uid,
    dialecticaSpecVersion: pkg.manifest.spec_version,
  };

  return {
    manifest: pkg.manifest,
    capsuleInput,
    preview: buildDialecticaCapsuleImportPreview({
      ...pkg,
      importNotes: uniqueStrings(importNotes),
    }),
    reviewPatch: {
      sourceRefs,
      claimLedger,
      ...(temporality ? { temporality } : {}),
      ...(ontologyBinding ? { ontologyBinding } : {}),
      ...(embeddedGraph ? { embeddedGraph } : {}),
    },
    importNotes: uniqueStrings(importNotes),
    proposedRowsRetainedForReview: claimLedger.length + sourceRefs.length,
  };
}

function parseJsonlRecords(
  text: string,
  path: string,
  maxRecords: number,
  importNotes: string[],
): Record<string, unknown>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((entry) => entry.line.length > 0);
  if (lines.length > maxRecords) {
    throw new DialecticaCapsuleImportError(`${path} exceeds the ${DIALECTICA_MAX_CLAIMS} claim line limit.`, [{
      field: path,
      message: `${path} exceeds the ${DIALECTICA_MAX_CLAIMS} claim line limit.`,
    }], 400, importNotes);
  }
  return lines.map(({ line, lineNumber }) => {
    try {
      return parseRecord(JSON.parse(line), `${path}:${lineNumber}`);
    } catch (error) {
      if (error instanceof DialecticaCapsuleImportError) throw error;
      throw new DialecticaCapsuleImportError(`Malformed JSONL in ${path} at line ${lineNumber}.`, [{
        field: `${path}:${lineNumber}`,
        message: `Malformed JSONL in ${path} at line ${lineNumber}.`,
      }], 400, importNotes);
    }
  });
}

function normalizeEpisodes(input: unknown, importNotes: string[], layersPresent: string[]): Record<string, unknown>[] {
  if (input === undefined || input === null) {
    if (layersPresent.includes('temporal')) {
      importNotes.push('episodes.json missing; temporal layer is reported without timeline anchors.');
    }
    return [];
  }
  if (Array.isArray(input)) {
    return input.map((episode, index) => parseRecord(episode, `episodes.json:${index + 1}`));
  }
  if (isRecord(input) && Array.isArray(input.episodes)) {
    return input.episodes.map((episode, index) => parseRecord(episode, `episodes.json.episodes:${index + 1}`));
  }
  throw new DialecticaCapsuleImportError('episodes.json must be an array or an object with an episodes array.', [{
    field: 'episodes.json',
    message: 'episodes.json must be an array or an object with an episodes array.',
  }], 400, importNotes);
}

function mapSources(sources: Record<string, unknown>[]): ContextCapsuleSourceRef[] {
  return sources.flatMap((source, index): ContextCapsuleSourceRef[] => {
    const sourceId = sourceIdOf(source) ?? `source-${index + 1}`;
    return [{
      sourceId,
      label: stringOrNull(source.title) ?? stringOrNull(source.label) ?? sourceId,
      url: stringOrNull(source.uri) ?? stringOrNull(source.url),
      publisher: stringOrNull(source.publisher),
      date: stringOrNull(source.retrieved_at) ?? stringOrNull(source.date),
    }];
  });
}

function mapClaim(
  claim: Record<string, unknown>,
  index: number,
  sourceById: Map<string, ContextCapsuleSourceRef>,
): ContextCapsuleClaim {
  const claimId = stringOrNull(claim.claim_id) ?? stringOrNull(claim.id) ?? `claim-${index + 1}`;
  const text = stringOrNull(claim.text) ?? stringOrNull(claim.claim) ?? claimId;
  const provenanceRefs = claimProvenanceRefs(claim);
  const sourceRefIds = provenanceRefs.filter((sourceId) => sourceById.has(sourceId));
  const support = claim.disputed === true
    ? 'disputed'
    : sourceRefIds.length
      ? 'supported'
      : 'needs_source';
  const receipts = sourceRefIds.map((sourceId): EvidenceReceipt => {
    const source = sourceById.get(sourceId);
    return {
      sourceId,
      url: source?.url ?? null,
      publisher: source?.publisher ?? null,
      date: source?.date ?? null,
      snippet: `DIALECTICA provenance refs: ${provenanceRefs.join(', ') || sourceId}.`,
      charOffset: sourceSpanOffset(claim),
      confidence: confidenceOrNull(claim.confidence),
      stance: claim.disputed === true ? 'mixed' : 'supports',
    };
  });

  return {
    claimId,
    text,
    support,
    sourceRefIds,
    ...(claim.trust_layer || claim.origin || claim.episode_id || provenanceRefs.length
      ? { caveat: claimCaveat(claim, provenanceRefs) }
      : {}),
    ...(receipts.length ? { receipts } : {}),
    validFrom: stringOrNull(claim.valid_from),
    validUntil: stringOrNull(claim.valid_to),
    asOf: stringOrNull(claim.observed_at) ?? stringOrNull(claim.as_of),
  };
}

function claimProvenanceRefs(claim: Record<string, unknown>): string[] {
  const refs = [
    ...cleanStringArray(claim.sourceRefIds),
    ...cleanStringArray(claim.source_refs),
    ...cleanStringArray(claim.source_ids),
  ];
  const sourceSpan = isRecord(claim.source_span) ? claim.source_span : null;
  const spanSourceId = sourceSpan ? stringOrNull(sourceSpan.source_id) : null;
  if (spanSourceId) refs.push(spanSourceId);
  const corroboration = isRecord(claim.corroboration) ? claim.corroboration : null;
  refs.push(...cleanStringArray(corroboration?.sources));
  return uniqueStrings(refs);
}

function claimCaveat(claim: Record<string, unknown>, provenanceRefs: string[]): string {
  const bits = [
    stringOrNull(claim.trust_layer) ? `trust layer ${stringOrNull(claim.trust_layer)}` : null,
    stringOrNull(claim.origin) ? `origin ${stringOrNull(claim.origin)}` : null,
    stringOrNull(claim.episode_id) ? `episode ${stringOrNull(claim.episode_id)}` : null,
    provenanceRefs.length ? `provenance refs ${provenanceRefs.join(', ')}` : null,
  ].filter(Boolean);
  return `Imported from DIALECTICA (${bits.join('; ')}).`;
}

function sourceSpanOffset(claim: Record<string, unknown>): { start: number; end: number } | null {
  const span = isRecord(claim.source_span) ? claim.source_span : {};
  const start = numberOrNull(span.start);
  const end = numberOrNull(span.end);
  return start !== null && end !== null && end >= start ? { start, end } : null;
}

function mapEpisodes(episodes: Record<string, unknown>[], importNotes: string[]): Record<string, unknown> | undefined {
  if (!episodes.length) return undefined;
  const unmappedKeys = new Set<string>();
  const timelineAnchors = episodes.map((episode, index) => {
    const allowed = new Set(['id', 'episode_id', 'label', 'title', 'type', 't_start', 't_end', 'date', 'participants', 'member_claims']);
    for (const key of Object.keys(episode)) {
      if (!allowed.has(key)) unmappedKeys.add(key);
    }
    const id = stringOrNull(episode.episode_id) ?? stringOrNull(episode.id) ?? `episode-${index + 1}`;
    return {
      id,
      label: stringOrNull(episode.label) ?? stringOrNull(episode.title) ?? id,
      kind: stringOrNull(episode.type) ?? 'episode',
      date: stringOrNull(episode.t_start) ?? stringOrNull(episode.date),
      start: stringOrNull(episode.t_start) ?? stringOrNull(episode.date),
      end: stringOrNull(episode.t_end),
      participants: cleanStringArray(episode.participants),
      claimIds: cleanStringArray(episode.member_claims),
    };
  });
  if (unmappedKeys.size) {
    importNotes.push(`episodes.json fields not mapped into timeline anchors: ${Array.from(unmappedKeys).sort().join(', ')}.`);
  }
  return {
    source: 'dialectica:episodes.json',
    timelineAnchors,
  };
}

function mapOntologyBinding(pkg: DialecticaParsedCapsulePackage): Record<string, unknown> | undefined {
  if (!pkg.manifest.cores.includes('aco')) return undefined;
  const primitives = uniqueStrings(pkg.claims.map((claim) => stringOrNull(claim.primitive)).filter((value): value is string => Boolean(value)));
  return {
    source: 'dialectica:manifest.cores',
    ontologyIds: ['aco:base', `domain:${pkg.manifest.category}`],
    acoPrimitives: primitives.length ? primitives : ['Claim', 'Source', 'Episode'],
    capsuleCores: [...pkg.manifest.cores],
  };
}

function mapGraphJsonLd(
  graphJsonld: unknown,
  capsuleId: string,
  importNotes: string[],
  importedAt: string,
): Record<string, unknown> | undefined {
  if (!graphJsonld) {
    importNotes.push('graph.jsonld missing; embedded graph projection was not mapped.');
    return undefined;
  }
  const generatedBy: DialecticaGraphGeneratedBy = {
    actorType: 'model',
    actorId: getModelIdForTask('balanced'),
    at: importedAt,
    activity: 'import',
  };
  const projection = buildLadybugProjectionFromGraphJsonLd(graphJsonld, { capsuleId });
  return {
    ...projection,
    nodes: projection.nodes.map((node) => ({
      ...node,
      recordedAt: importedAt,
      generatedBy,
    })),
    edges: projection.edges.map((edge) => ({
      ...edge,
      recordedAt: importedAt,
      generatedBy,
    })),
  };
}

function dialecticaCapsuleId(capsuleId: string, version: number): string {
  return `dialectica-${capsuleId}-v${version}`.replace(/[^\w:.-]/g, '-').slice(0, 120);
}

async function requiredZipJson(zip: JSZip, path: string): Promise<unknown> {
  const text = await optionalZipText(zip, path);
  if (!text) {
    throw new DialecticaCapsuleImportError(`DIALECTICA capsule is missing ${path}.`, [{
      field: path,
      message: `${path} is required.`,
    }]);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new DialecticaCapsuleImportError(`DIALECTICA capsule ${path} must be valid JSON.`, [{
      field: path,
      message: `${path} must be valid JSON.`,
    }]);
  }
}

async function optionalZipJson(zip: JSZip, path: string): Promise<unknown> {
  const text = await optionalZipText(zip, path);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new DialecticaCapsuleImportError(`DIALECTICA capsule ${path} must be valid JSON.`, [{
      field: path,
      message: `${path} must be valid JSON.`,
    }]);
  }
}

async function optionalZipText(zip: JSZip, path: string): Promise<string | null> {
  return zip.file(path)?.async('string') ?? null;
}

function zodFieldErrors(error: z.ZodError): DialecticaFieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'manifest',
    message: issue.code === 'invalid_type' && (
      String(issue.message).toLowerCase() === 'required' ||
      String(issue.message).toLowerCase().includes('undefined')
    )
      ? `${issue.path.join('.') || 'manifest'} is required`
      : issue.message,
  }));
}

function parseRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new DialecticaCapsuleImportError(`${field} must be an object.`, [{
      field,
      message: `${field} must be an object.`,
    }]);
  }
  return value;
}

function sourceIdOf(source: Record<string, unknown>): string | null {
  return stringOrNull(source.source_id) ?? stringOrNull(source.sourceId) ?? stringOrNull(source.id);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

function confidenceOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(1, value > 1 ? value / 100 : value)) * 1000) / 1000;
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

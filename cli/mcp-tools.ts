import { z } from 'zod';
import { compileContext, WORKER_ROLES } from '../src/lib/cognitive-capsule/compiler';
import { CognitiveCapsuleSchema } from '../src/lib/cognitive-capsule/schema';
import { HostedRegistryRequestSchema, RegistryNameSchema, RegistryVersionSchema } from '../src/lib/cognitive-capsule/hosted-registry-contract';
import { remoteArtifact, remoteRequest, type RemoteOptions } from './praxis';

const id = z.string().regex(/^[a-zA-Z0-9._:-]{1,160}$/);
const cursor = z.string().max(2000).optional();
const registryRef = { name: RegistryNameSchema, version: RegistryVersionSchema };
export const PraxisMcpSchemas = {
  capsule_search: z.object({ query: z.string().trim().min(1).max(240), cursor }).strict(),
  capsule_inspect: z.object({ capsuleId: id, cursor }).strict(),
  capsule_view: z.object({ capsuleId: id, objective: z.string().min(1).max(4000), role: z.enum(WORKER_ROLES), scope: z.string().min(1).max(240), asOf: z.iso.datetime({ offset: true }), maxChars: z.number().int().min(512).max(24_000).default(12_000) }).strict(),
  capsule_evidence: z.object({ capsuleId: id, evidenceIds: z.array(z.string().min(1).max(240)).min(1).max(50) }).strict(),
  capsule_propose: z.object({ capsuleId: id, capture: z.record(z.string(), z.unknown()) }).strict(),
  registry_list: z.object({ cursor }).strict(),
  registry_impact: z.object(registryRef).strict(),
  registry_artifact: z.object(registryRef).strict(),
  registry_publish: z.object({ capsuleId: id, envelopeVersion: z.number().int().positive(), name: RegistryNameSchema }).strict(),
  registry_install: z.object(registryRef).strict(),
  registry_update: z.object({ ...registryRef, expectedDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/) }).strict(),
  registry_deprecate: z.object({ ...registryRef, reason: z.string().trim().min(1).max(600) }).strict(),
  run_receipt: z.object({ runId: id }).strict(),
};
export type PraxisMcpToolName = keyof typeof PraxisMcpSchemas;
export const PRAXIS_MCP_MUTATIONS = new Set<PraxisMcpToolName>(['capsule_propose', 'registry_publish', 'registry_install', 'registry_update', 'registry_deprecate']);

export class PraxisMcpTools {
  constructor(private readonly options: RemoteOptions, private readonly allowWrite = false) {}

  async call(name: PraxisMcpToolName, value: unknown): Promise<unknown> {
    if (!(name in PraxisMcpSchemas)) throw new Error('Unknown PRAXIS MCP tool.');
    if (PRAXIS_MCP_MUTATIONS.has(name) && !this.allowWrite) throw new Error('MCP writes require explicit operator --allow-write at startup.');
    const args = PraxisMcpSchemas[name].parse(value) as Record<string, unknown>;
    const path = args.capsuleId ? `/api/context/capsules/${encodeURIComponent(String(args.capsuleId))}/cognition` : '';
    const registryPath = '/api/context/capsule-registry';
    const query = new URLSearchParams({ name: String(args.name), version: String(args.version) });
    if (name === 'capsule_search') {
      // Search this owner-scoped inventory page; expose pagination rather than implying global completeness.
      const result = await remoteRequest(`/api/context/capsules${args.cursor ? `?cursor=${encodeURIComponent(String(args.cursor))}` : ''}`, 'GET', undefined, this.options);
      if (!result || typeof result !== 'object' || !('capsules' in result) || !Array.isArray(result.capsules)) throw new Error('Invalid capsule inventory response.');
      const term = String(args.query).toLocaleLowerCase('en');
      const matches = result.capsules.filter((c) => c && typeof c === 'object' && ['label', 'summary', 'capsuleId'].some((key) => String(c[key] ?? '').toLocaleLowerCase('en').includes(term)));
      return { ...result, capsules: matches, searchScope: 'owner-inventory-page', query: args.query };
    }
    if (name === 'capsule_inspect') return remoteRequest(`${path}${args.cursor ? `?cursor=${encodeURIComponent(String(args.cursor))}` : ''}`, 'GET', undefined, this.options);
    if (name === 'capsule_view' || name === 'capsule_evidence') {
      const result = await remoteRequest(path, 'GET', undefined, this.options);
      if (!result || typeof result !== 'object' || !('cognition' in result)) throw new Error('Invalid cognition inventory response.');
      const cognition = CognitiveCapsuleSchema.parse(result.cognition);
      if (cognition.capsuleId !== args.capsuleId) throw new Error('Cognition identity mismatch.');
      if (name === 'capsule_view') return compileContext(cognition, args as unknown as Parameters<typeof compileContext>[1]);
      const requested = args.evidenceIds as string[];
      return { capsuleId: cognition.capsuleId, version: cognition.version, evidence: cognition.evidence.filter((span) => requested.includes(span.id)), missingIds: requested.filter((requestedId) => !cognition.evidence.some((span) => span.id === requestedId)), factualTruthVerified: false };
    }
    if (name === 'capsule_propose') {
      const body = { operation: 'model-proposal', capture: args.capture };
      if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 64_000) throw new Error('Expertise request byte budget exceeded.');
      return remoteRequest(path, 'POST', body, this.options);
    }
    if (name === 'registry_list') return remoteRequest(`${registryPath}${args.cursor ? `?cursor=${encodeURIComponent(String(args.cursor))}` : ''}`, 'GET', undefined, this.options);
    if (name === 'registry_impact') return remoteRequest(`${registryPath}/impact?${query}`, 'GET', undefined, this.options);
    if (name === 'registry_artifact') {
      const artifact = await remoteArtifact(`${registryPath}/artifact?${query}`, this.options, true);
      if (artifact.capsule.version !== args.version || artifact.capsule.capsuleId !== args.name) throw new Error('Native artifact identity or version mismatch.');
      // A bounded validated artifact is represented as bytes, never an unverified external URL.
      return { name: args.name, version: artifact.capsule.version, digest: artifact.digest, manifest: artifact.manifest, base64: artifact.bytes.toString('base64'), encoding: 'base64', factualTruthVerified: false };
    }
    if (name.startsWith('registry_')) return remoteRequest(registryPath, 'POST', HostedRegistryRequestSchema.parse({ operation: name.slice('registry_'.length), ...args }), this.options);
    if (name === 'run_receipt') return remoteRequest(`/api/agents/runs/${encodeURIComponent(String(args.runId))}`, 'GET', undefined, this.options);
    throw new Error('Unknown PRAXIS MCP tool.');
  }
}

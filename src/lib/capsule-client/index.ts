import { z } from 'zod';

const IdSchema = z.string().min(1).max(240);
const DigestSchema = z.string().regex(/^digest:[a-f0-9]{8}$/);
const IsoDateSchema = z.string().datetime();

export const CapsuleClientModeSchema = z.enum(['fixture', 'localApi', 'disabled']);
export type CapsuleClientMode = z.infer<typeof CapsuleClientModeSchema>;

export const CapsuleTypeSchema = z.enum(['user', 'situation', 'tool', 'output']);
export type CapsuleType = z.infer<typeof CapsuleTypeSchema>;

export const CapsuleTrustSchema = z.enum(['trusted', 'review', 'experimental']);
export const CapsuleFreshnessSchema = z.enum(['fresh', 'stale', 'unknown']);
export const CapsuleSourceSchema = z.enum(['fixture', 'localApi', 'firestore', 'dialectica']);

export const CapsuleManifestSchema = z.object({
  id: IdSchema,
  type: CapsuleTypeSchema,
  title: z.string().min(1).max(240),
  version: z.string().min(1).max(80),
  digest: DigestSchema,
  trust: CapsuleTrustSchema,
  freshness: CapsuleFreshnessSchema,
  source: CapsuleSourceSchema,
  compiledAt: IsoDateSchema.optional(),
  description: z.string().max(600).optional(),
  author: z.string().max(160).optional(),
});

export const CapsuleGraphPreviewSchema = z.object({
  capsuleId: IdSchema,
  digest: DigestSchema,
  nodes: z.array(z.object({
    id: IdSchema,
    label: z.string().min(1).max(240),
    type: z.enum(['capsule', 'claim', 'source', 'contract', 'device']),
  })).default([]),
  edges: z.array(z.object({
    from: IdSchema,
    to: IdSchema,
    label: z.string().min(1).max(120),
  })).default([]),
  warnings: z.array(z.string().min(1).max(300)).default([]),
});

export const MergedRuntimeContractSchema = z.object({
  citation: z.object({
    required: z.boolean(),
    allowedTiers: z.array(z.enum(['T1', 'T2', 'T3'])).default(['T1', 'T2', 'T3']),
  }),
  freshness: z.object({
    requireStatus: z.boolean(),
    maxAgeDays: z.number().int().positive().nullable(),
  }),
  hedge: z.object({
    requiredForT3: z.boolean(),
    requiredForUncertainty: z.boolean(),
  }),
  disputed: z.object({
    flagDisputedClaims: z.boolean(),
  }),
  attribution: z.object({
    citeMaterialToolCapsules: z.boolean(),
  }),
  export: z.object({
    blockOnViolations: z.boolean(),
    allowedFormats: z.array(z.enum(['markdown', 'docx', 'pdf', 'json'])).default(['markdown', 'docx', 'json']),
  }),
});

export const CapsuleContributionSchema = z.object({
  capsuleId: IdSchema,
  digest: DigestSchema,
  tokenEstimate: z.number().int().nonnegative(),
  claimIds: z.array(IdSchema).default([]),
  role: CapsuleTypeSchema,
});

export const CapsuleContextPackSchema = z.object({
  id: IdSchema,
  capsuleIds: z.array(IdSchema).min(1).max(20),
  digest: DigestSchema,
  createdAt: IsoDateSchema,
  tokenBudget: z.object({
    maxTokens: z.number().int().positive(),
    estimatedTokens: z.number().int().nonnegative(),
    compressionNotes: z.array(z.string().min(1).max(300)).default([]),
  }),
  contributions: z.array(CapsuleContributionSchema).min(1),
  runtimeContract: MergedRuntimeContractSchema,
  sections: z.array(z.object({
    id: IdSchema,
    title: z.string().min(1).max(240),
    content: z.string().min(1).max(6000),
    sourceCapsuleIds: z.array(IdSchema).min(1),
  })).default([]),
  warnings: z.array(z.object({
    severity: z.enum(['info', 'review', 'blocking']),
    message: z.string().min(1).max(400),
    capsuleId: IdSchema.optional(),
  })).default([]),
});

export const CapsuleSetInputSchema = z.object({
  capsuleIds: z.array(IdSchema).min(1).max(20),
});

export const CapsuleSetSchema = CapsuleSetInputSchema.extend({
  id: IdSchema,
  digest: DigestSchema,
  manifests: z.array(CapsuleManifestSchema).min(1),
  warnings: z.array(z.string().min(1).max(300)).default([]),
});

export const CapsuleReadReceiptInputSchema = z.object({
  readerId: IdSchema,
  capsuleIds: z.array(IdSchema).min(1).max(20),
  contextPackDigest: DigestSchema,
});

export const CapsuleReadReceiptSchema = CapsuleReadReceiptInputSchema.extend({
  id: IdSchema,
  readAt: IsoDateSchema,
  source: CapsuleSourceSchema,
});

export const CapsuleMarketplaceListingSchema = z.object({
  id: IdSchema,
  capsuleId: IdSchema,
  title: z.string().min(1).max(240),
  type: CapsuleTypeSchema,
  summary: z.string().min(1).max(600),
  digest: DigestSchema,
  version: z.string().min(1).max(80),
  author: z.string().min(1).max(160),
  trust: CapsuleTrustSchema,
  tags: z.array(z.string().min(1).max(80)).default([]),
  featured: z.boolean().default(false),
});

export type CapsuleManifest = z.infer<typeof CapsuleManifestSchema>;
export type CapsuleGraphPreview = z.infer<typeof CapsuleGraphPreviewSchema>;
export type MergedRuntimeContract = z.infer<typeof MergedRuntimeContractSchema>;
export type CapsuleContextPack = z.infer<typeof CapsuleContextPackSchema>;
export type CapsuleSetInput = z.infer<typeof CapsuleSetInputSchema>;
export type CapsuleSet = z.infer<typeof CapsuleSetSchema>;
export type CapsuleReadReceiptInput = z.infer<typeof CapsuleReadReceiptInputSchema>;
export type CapsuleReadReceipt = z.infer<typeof CapsuleReadReceiptSchema>;
export type CapsuleMarketplaceListing = z.infer<typeof CapsuleMarketplaceListingSchema>;

export interface CapsuleClient {
  getManifest(capsuleId: string): Promise<CapsuleManifest>;
  getGraphPreview(capsuleId: string): Promise<CapsuleGraphPreview>;
  getContextPack(input: CapsuleSet | CapsuleSetInput | string[]): Promise<CapsuleContextPack>;
  combineCapsules(input: CapsuleSetInput | string[]): Promise<CapsuleSet>;
  recordReadReceipt(input: CapsuleReadReceiptInput): Promise<CapsuleReadReceipt>;
  listMarketplace(): Promise<CapsuleMarketplaceListing[]>;
}

export interface CapsuleClientConfig {
  mode?: CapsuleClientMode;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  now?: () => Date;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class CapsuleClientUnavailableError extends Error {
  readonly code = 'CAPSULE_CLIENT_UNAVAILABLE';

  constructor(message: string) {
    super(message);
    this.name = 'CapsuleClientUnavailableError';
  }
}

export function createCapsuleClient(config: CapsuleClientConfig = {}): CapsuleClient {
  const mode = config.mode ?? 'disabled';
  if (mode === 'fixture') return new FixtureCapsuleClient(config.now);
  if (mode === 'localApi') return new LocalApiCapsuleClient(config);
  return new DisabledCapsuleClient();
}

export function parseCapsuleContextPack(input: unknown): CapsuleContextPack {
  return CapsuleContextPackSchema.parse(input);
}

export function computeCapsuleDigest(input: unknown): string {
  const body = stableStringify(input);
  let hash = 0x811c9dc5;
  for (let index = 0; index < body.length; index += 1) {
    hash ^= body.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `digest:${hash.toString(16).padStart(8, '0')}`;
}

class FixtureCapsuleClient implements CapsuleClient {
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getManifest(capsuleId: string): Promise<CapsuleManifest> {
    const manifest = FIXTURE_MANIFESTS_BY_ID.get(capsuleId);
    if (!manifest) throw new CapsuleClientUnavailableError(`Fixture capsule not found: ${capsuleId}`);
    return CapsuleManifestSchema.parse(manifest);
  }

  async getGraphPreview(capsuleId: string): Promise<CapsuleGraphPreview> {
    const manifest = await this.getManifest(capsuleId);
    const preview = FIXTURE_GRAPH_PREVIEWS_BY_ID.get(capsuleId) ?? buildGraphPreview(manifest);
    return CapsuleGraphPreviewSchema.parse(preview);
  }

  async getContextPack(input: CapsuleSet | CapsuleSetInput | string[]): Promise<CapsuleContextPack> {
    const set = isCapsuleSet(input) ? CapsuleSetSchema.parse(input) : await this.combineCapsules(input);
    const estimatedTokens = set.manifests.reduce((sum, manifest) => sum + tokenEstimateForManifest(manifest), 0);
    return CapsuleContextPackSchema.parse({
      id: `ctx-${set.digest.slice('digest:'.length)}`,
      capsuleIds: set.capsuleIds,
      digest: set.digest,
      createdAt: this.now().toISOString(),
      tokenBudget: {
        maxTokens: 12000,
        estimatedTokens,
        compressionNotes: [
          estimatedTokens > 8000 ? 'Fixture pack would require compression before a long Ask turn.' : 'Fixture pack fits the default Ask budget.',
        ],
      },
      contributions: set.manifests.map((manifest) => ({
        capsuleId: manifest.id,
        digest: manifest.digest,
        tokenEstimate: tokenEstimateForManifest(manifest),
        claimIds: [`${manifest.id}:claim:core`],
        role: manifest.type,
      })),
      runtimeContract: DEFAULT_RUNTIME_CONTRACT,
      sections: set.manifests.map((manifest) => ({
        id: `${manifest.id}:section:summary`,
        title: manifest.title,
        content: manifest.description ?? `${manifest.title} fixture context.`,
        sourceCapsuleIds: [manifest.id],
      })),
      warnings: set.warnings.map((message) => ({ severity: 'review', message })),
    });
  }

  async combineCapsules(input: CapsuleSetInput | string[]): Promise<CapsuleSet> {
    const { capsuleIds } = normalizeCapsuleSetInput(input);
    const manifests = await Promise.all(capsuleIds.map((capsuleId) => this.getManifest(capsuleId)));
    const digest = computeCapsuleDigest({
      capsuleIds,
      manifestDigests: manifests.map((manifest) => manifest.digest),
      contractVersion: CAPSULE_CLIENT_FIXTURE_VERSION,
    });
    return CapsuleSetSchema.parse({
      id: `set-${digest.slice('digest:'.length)}`,
      capsuleIds,
      digest,
      manifests,
      warnings: [],
    });
  }

  async recordReadReceipt(input: CapsuleReadReceiptInput): Promise<CapsuleReadReceipt> {
    const parsed = CapsuleReadReceiptInputSchema.parse(input);
    const digest = computeCapsuleDigest({
      ...parsed,
      fixtureVersion: CAPSULE_CLIENT_FIXTURE_VERSION,
    });
    return CapsuleReadReceiptSchema.parse({
      ...parsed,
      id: `receipt-${digest.slice('digest:'.length)}`,
      readAt: this.now().toISOString(),
      source: 'fixture',
    });
  }

  async listMarketplace(): Promise<CapsuleMarketplaceListing[]> {
    return z.array(CapsuleMarketplaceListingSchema).parse(FIXTURE_MARKETPLACE_LISTINGS);
  }
}

class LocalApiCapsuleClient implements CapsuleClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: CapsuleClientConfig) {
    if (!config.baseUrl) throw new CapsuleClientUnavailableError('Capsule local API mode requires baseUrl.');
    const fetchImpl = config.fetchImpl ?? globalThis.fetch;
    if (!fetchImpl) throw new CapsuleClientUnavailableError('Capsule local API mode requires fetch.');
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = fetchImpl;
  }

  getManifest(capsuleId: string): Promise<CapsuleManifest> {
    return this.request(`/v1/capsules/${encodeURIComponent(capsuleId)}/manifest`, undefined, CapsuleManifestSchema);
  }

  getGraphPreview(capsuleId: string): Promise<CapsuleGraphPreview> {
    return this.request(`/v1/capsules/${encodeURIComponent(capsuleId)}/graph-preview`, undefined, CapsuleGraphPreviewSchema);
  }

  getContextPack(input: CapsuleSet | CapsuleSetInput | string[]): Promise<CapsuleContextPack> {
    const body = isCapsuleSet(input) ? CapsuleSetSchema.parse(input) : normalizeCapsuleSetInput(input);
    return this.request('/v1/context-packs', jsonPost(body), CapsuleContextPackSchema);
  }

  combineCapsules(input: CapsuleSetInput | string[]): Promise<CapsuleSet> {
    return this.request('/v1/context-packs:combine', jsonPost(normalizeCapsuleSetInput(input)), CapsuleSetSchema);
  }

  recordReadReceipt(input: CapsuleReadReceiptInput): Promise<CapsuleReadReceipt> {
    return this.request('/v1/read-receipts', jsonPost(CapsuleReadReceiptInputSchema.parse(input)), CapsuleReadReceiptSchema);
  }

  listMarketplace(): Promise<CapsuleMarketplaceListing[]> {
    return this.request('/v1/marketplace', undefined, z.array(CapsuleMarketplaceListingSchema));
  }

  private async request<T>(path: string, init: RequestInit | undefined, schema: z.ZodType<T>): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      throw new CapsuleClientUnavailableError(`Capsule local API request failed: ${response.status}`);
    }
    const payload = await response.json();
    return schema.parse(payload);
  }
}

class DisabledCapsuleClient implements CapsuleClient {
  getManifest(): Promise<CapsuleManifest> {
    return disabled();
  }

  getGraphPreview(): Promise<CapsuleGraphPreview> {
    return disabled();
  }

  getContextPack(): Promise<CapsuleContextPack> {
    return disabled();
  }

  combineCapsules(): Promise<CapsuleSet> {
    return disabled();
  }

  recordReadReceipt(): Promise<CapsuleReadReceipt> {
    return disabled();
  }

  listMarketplace(): Promise<CapsuleMarketplaceListing[]> {
    return disabled();
  }
}

const CAPSULE_CLIENT_FIXTURE_VERSION = '2026-06-10.praxis-v3-fixture.1';

const DEFAULT_RUNTIME_CONTRACT: MergedRuntimeContract = {
  citation: {
    required: true,
    allowedTiers: ['T1', 'T2', 'T3'],
  },
  freshness: {
    requireStatus: true,
    maxAgeDays: 90,
  },
  hedge: {
    requiredForT3: true,
    requiredForUncertainty: true,
  },
  disputed: {
    flagDisputedClaims: true,
  },
  attribution: {
    citeMaterialToolCapsules: true,
  },
  export: {
    blockOnViolations: true,
    allowedFormats: ['markdown', 'docx', 'json'],
  },
};

const FIXTURE_MANIFESTS: CapsuleManifest[] = [
  fixtureManifest({
    id: 'fixture-user-policy-director',
    type: 'user',
    title: 'Policy Director User Core',
    version: 'v1',
    trust: 'trusted',
    freshness: 'fresh',
    source: 'fixture',
    compiledAt: '2026-06-10T00:00:00.000Z',
    author: 'PRAXIS fixture runtime',
    description: 'User capsule fixture for a policy director who needs cited, reviewable decision support.',
  }),
  fixtureManifest({
    id: 'fixture-situation-nordalia-corridor',
    type: 'situation',
    title: 'Nordalia Corridor Situation',
    version: 'v1',
    trust: 'review',
    freshness: 'fresh',
    source: 'fixture',
    compiledAt: '2026-06-10T00:00:00.000Z',
    author: 'PRAXIS fixture runtime',
    description: 'Situation capsule fixture covering actors, open claims, and unresolved evidence gaps for the Nordalia corridor demo path.',
  }),
  fixtureManifest({
    id: 'fixture-output-options-memo',
    type: 'output',
    title: 'Options Memo Output Contract',
    version: 'v1',
    trust: 'trusted',
    freshness: 'unknown',
    source: 'fixture',
    compiledAt: '2026-06-10T00:00:00.000Z',
    author: 'PRAXIS fixture runtime',
    description: 'Output capsule fixture requiring cited claims, explicit uncertainty, and a final recommendation table.',
  }),
  fixtureManifest({
    id: 'fixture-tool-sourceability-matrix',
    type: 'tool',
    title: 'Sourceability Matrix Tool',
    version: 'v1',
    trust: 'experimental',
    freshness: 'fresh',
    source: 'fixture',
    compiledAt: '2026-06-10T00:00:00.000Z',
    author: 'PRAXIS fixture runtime',
    description: 'Tool capsule fixture that scores claims by citation coverage, source tier, freshness, and dispute status.',
  }),
];

const FIXTURE_MANIFESTS_BY_ID = new Map(FIXTURE_MANIFESTS.map((manifest) => [manifest.id, manifest]));

const FIXTURE_GRAPH_PREVIEWS_BY_ID = new Map(
  FIXTURE_MANIFESTS.map((manifest) => [manifest.id, buildGraphPreview(manifest)]),
);

const FIXTURE_MARKETPLACE_LISTINGS: CapsuleMarketplaceListing[] = FIXTURE_MANIFESTS
  .filter((manifest) => manifest.type === 'tool')
  .map((manifest) => CapsuleMarketplaceListingSchema.parse({
    id: `listing-${manifest.id}`,
    capsuleId: manifest.id,
    title: manifest.title,
    type: manifest.type,
    summary: manifest.description ?? manifest.title,
    digest: manifest.digest,
    version: manifest.version,
    author: manifest.author ?? 'PRAXIS fixture runtime',
    trust: manifest.trust,
    tags: ['fixture', 'review', 'sourceability'],
    featured: true,
  }));

function fixtureManifest(input: Omit<CapsuleManifest, 'digest'>): CapsuleManifest {
  return CapsuleManifestSchema.parse({
    ...input,
    digest: computeCapsuleDigest({
      ...input,
      fixtureVersion: CAPSULE_CLIENT_FIXTURE_VERSION,
    }),
  });
}

function buildGraphPreview(manifest: CapsuleManifest): CapsuleGraphPreview {
  return CapsuleGraphPreviewSchema.parse({
    capsuleId: manifest.id,
    digest: manifest.digest,
    nodes: [
      { id: manifest.id, label: manifest.title, type: 'capsule' },
      { id: `${manifest.id}:claim:core`, label: 'Core claim frame', type: 'claim' },
      { id: `${manifest.id}:contract`, label: 'Runtime contract', type: 'contract' },
    ],
    edges: [
      { from: manifest.id, to: `${manifest.id}:claim:core`, label: 'contributes' },
      { from: manifest.id, to: `${manifest.id}:contract`, label: 'governs' },
    ],
    warnings: [],
  });
}

function normalizeCapsuleSetInput(input: CapsuleSetInput | string[]): CapsuleSetInput {
  if (Array.isArray(input)) return CapsuleSetInputSchema.parse({ capsuleIds: input });
  return CapsuleSetInputSchema.parse(input);
}

function isCapsuleSet(input: unknown): input is CapsuleSet {
  return CapsuleSetSchema.safeParse(input).success;
}

function tokenEstimateForManifest(manifest: CapsuleManifest): number {
  return 480 + Math.ceil((manifest.description?.length ?? manifest.title.length) / 3);
}

function jsonPost(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function disabled<T>(): Promise<T> {
  return Promise.reject(new CapsuleClientUnavailableError('Capsule client is disabled.'));
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

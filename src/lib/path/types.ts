import { z } from 'zod';
import { DOMAIN_IDS, type DomainId } from '@/types/domain';

export const PATH_SCHEMA_VERSION = 1 as const;

export const PATH_IDS = [
  'conflict-path',
  'diplomacy-path',
  'humanitarian-path',
  'rights-path',
  'governance-path',
  'economic-path',
  'development-path',
  'climate-path',
  'info-path',
  'transnational-path',
] as const;

export type PathId = typeof PATH_IDS[number];

export function isPathId(value: unknown): value is PathId {
  return typeof value === 'string' && (PATH_IDS as readonly string[]).includes(value);
}

export const PATH_DOMAIN_MAP: Record<PathId, Exclude<DomainId, 'generic'>> = {
  'conflict-path': 'armed-conflict-security',
  'diplomacy-path': 'diplomacy-negotiation',
  'humanitarian-path': 'humanitarian',
  'rights-path': 'human-rights',
  'governance-path': 'governance-rule-of-law',
  'economic-path': 'economic-sanctions',
  'development-path': 'development-stabilization',
  'climate-path': 'climate-environmental-security',
  'info-path': 'information-cyber',
  'transnational-path': 'transnational-threats',
};

export function pathIdForDomain(domainId?: string | null): PathId | null {
  if (!domainId || domainId === 'generic') return null;
  return (Object.entries(PATH_DOMAIN_MAP).find(([, domain]) => domain === domainId)?.[0] as PathId | undefined) ?? null;
}

export type ToolId = string;
export type TimeHorizon = string;
export type PathLensId =
  | 'power'
  | 'security'
  | 'escalation'
  | 'interests'
  | 'leverage'
  | 'normative'
  | 'needs'
  | 'access'
  | 'protection'
  | 'identity'
  | 'institutional'
  | 'salience'
  | 'economic'
  | 'environmental'
  | 'informational'
  | 'structural';
export type FrameworkId = string;
export type AudienceId =
  | 'ops-room'
  | 'principal'
  | 'field-team'
  | 'advocacy'
  | 'reformers'
  | 'treasury'
  | 'donors'
  | 'planners'
  | 'comms-lead'
  | 'enforcement';
export type FeedId = string;
export type ContextCoreId = 'user' | 'situation' | 'path' | 'source' | 'graph' | 'time' | 'output';

export const PathPromptVoiceSchema = z.object({
  tone: z.string().min(1).max(80),
  hedging: z.string().min(1).max(80),
  citationStyle: z.string().min(1).max(80),
  jargonLevel: z.string().min(1).max(80),
});

export const PathOutputDefaultsSchema = z.object({
  format: z.string().min(1).max(80),
  length: z.string().min(1).max(80),
  footnoteStyle: z.string().min(1).max(80),
});

export const PathConfigSchema = z.object({
  id: z.enum(PATH_IDS),
  name: z.string().min(1).max(100),
  domainId: z.enum(DOMAIN_IDS),
  description: z.string().max(500).default(''),
  version: z.number().int().nonnegative(),
  schemaVersion: z.number().int().min(1).default(PATH_SCHEMA_VERSION),
  toolBundle: z.array(z.string().min(1).max(100)).min(1).max(24),
  timeHorizonDefault: z.string().min(1).max(80),
  lensTop3: z.array(z.string().min(1).max(80)).length(3),
  lensWeights: z.record(z.string(), z.number().min(0).max(2)).default({}),
  frameworkPath: z.array(z.string().min(1).max(100)).min(1).max(12),
  audienceDefault: z.string().min(1).max(80),
  sourceMix: z.array(z.object({
    feed: z.string().min(1).max(100),
    weight: z.number().min(0).max(1),
  })).min(1).max(16),
  promptVoice: PathPromptVoiceSchema,
  outputDefaults: PathOutputDefaultsSchema,
  contextRecipe: z.array(z.enum(['user', 'situation', 'path', 'source', 'graph', 'time', 'output'])).min(1).max(7),
  creditMultiplier: z.number().min(0.25).max(3).default(1),
  promptOverrides: z.record(z.string(), z.string().max(4000)).default({}),
  updatedAt: z.any().optional(),
  updatedBy: z.string().optional(),
});

export type PathConfig = z.infer<typeof PathConfigSchema>;
export type MergedPathConfig = PathConfig;

export const PATH_COLLECTION = 'paths' as const;
export const PATH_DOC_PATH = (id: PathId): string => `paths/${id}`;
export const PATH_META_PATH = 'paths_meta/current' as const;
export const PATH_HISTORY_PATH = (id: PathId, version: number): string =>
  `paths_history/${id}_${version}`;

export const PathMetaSchema = z.object({
  schemaVersion: z.number().int().min(1),
  migrations: z.array(z.string()).default([]),
  lastSeededAt: z.any().optional(),
  seededVersion: z.number().int().nonnegative().default(0),
});

export type PathMeta = z.infer<typeof PathMetaSchema>;

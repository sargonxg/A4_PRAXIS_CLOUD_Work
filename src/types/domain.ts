/**
 * PRAXIS Domain Taxonomy — v1
 *
 * Domains are stored as live Firestore config at `config/domains/{domainId}`.
 * Every domain extends the `generic` baseline via prototypal inheritance.
 *
 * A domain carries: lens weights, preferred feeds, frameworks, prompt
 * overrides. `resolveDomain(id)` deep-merges `generic` + specific into
 * `MergedDomainConfig` ready for tools to consume.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md
 */

import { z } from 'zod';
import { LENSES, type Lens, type Audience, AUDIENCES } from './analyst-profile';

// ---------------------------------------------------------------------------
// Schema version
// ---------------------------------------------------------------------------

export const DOMAIN_SCHEMA_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Domain ids — source of truth for which domains exist in the platform
// ---------------------------------------------------------------------------

export const DOMAIN_IDS = [
  'generic',
  'armed-conflict-security',
  'diplomacy-negotiation',
  'humanitarian',
  'human-rights',
  'governance-rule-of-law',
  'economic-sanctions',
  'development-stabilization',
  'climate-environmental-security',
  'information-cyber',
  'transnational-threats',
] as const;

export type DomainId = typeof DOMAIN_IDS[number];

export function isDomainId(value: unknown): value is DomainId {
  return typeof value === 'string' && (DOMAIN_IDS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Lens weights — per-lens numeric multiplier (0.0-2.0); used by SKC re-rank
// ---------------------------------------------------------------------------

export type LensWeights = Partial<Record<Lens, number>>;

// ---------------------------------------------------------------------------
// DomainConfig — the raw Firestore shape
// ---------------------------------------------------------------------------

// Partial lens weights — a domain only specifies the overrides it cares about;
// unspecified lenses inherit from the parent (usually `generic`, which fills 1.0s).
const LensWeightsSchema = z
  .object(
    Object.fromEntries(LENSES.map((l) => [l, z.number().min(0).max(2).optional()])) as Record<
      Lens,
      z.ZodOptional<z.ZodNumber>
    >,
  )
  .partial();

export const DomainConfigSchema = z.object({
  id: z.enum(DOMAIN_IDS),
  name: z.string().min(1).max(80),
  description: z.string().max(400),
  parentId: z.enum(DOMAIN_IDS).nullable(),
  lensWeights: LensWeightsSchema.default({} as LensWeights),
  preferredFeeds: z.array(z.string().max(60)).max(32).default([]),
  frameworks: z.array(z.string().max(60)).max(32).default([]),
  promptOverrides: z.record(z.string(), z.string().max(4000)).default({}),
  defaultAudience: z.enum(AUDIENCES).nullable().default(null),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
  version: z.number().int().nonnegative(),
  schemaVersion: z.number().int().min(1).default(DOMAIN_SCHEMA_VERSION),
  updatedAt: z.any().optional(),
  updatedBy: z.string().optional(),
});

export type DomainConfig = z.infer<typeof DomainConfigSchema>;

// ---------------------------------------------------------------------------
// MergedDomainConfig — what resolveDomain returns (all fields guaranteed)
// ---------------------------------------------------------------------------

export interface MergedDomainConfig {
  id: DomainId;
  name: string;
  description: string;
  parentId: DomainId | null;
  lensWeights: Record<Lens, number>;
  preferredFeeds: string[];
  frameworks: string[];
  promptOverrides: Record<string, string>;
  defaultAudience: Audience | null;
  colorHex: string;
  icon: string;
  version: number;
  schemaVersion: number;
  /** Which parent's values ended up in which field — for debugging and provenance */
  inheritanceTrace?: {
    parent: DomainId | null;
    inheritedFields: string[];
    overriddenFields: string[];
  };
}

// ---------------------------------------------------------------------------
// Firestore paths
// ---------------------------------------------------------------------------

export const DOMAIN_COLLECTION = 'config' as const;
export const DOMAIN_DOC_PATH = (id: DomainId): string => `config/domains/${id}`;
export const DOMAIN_META_PATH = 'config/domains_meta/current' as const;
export const DOMAIN_HISTORY_PATH = (id: DomainId, version: number): string =>
  `config/domains_history/${id}_${version}`;

// ---------------------------------------------------------------------------
// Meta doc
// ---------------------------------------------------------------------------

export const DomainMetaSchema = z.object({
  schemaVersion: z.number().int().min(1),
  migrations: z.array(z.string()).default([]),
  lastSeededAt: z.any().optional(),
  seededVersion: z.number().int().nonnegative().default(0),
});

export type DomainMeta = z.infer<typeof DomainMetaSchema>;

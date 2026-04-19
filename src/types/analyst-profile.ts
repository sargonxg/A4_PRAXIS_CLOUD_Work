import { z } from 'zod';

export const LENSES = [
  'diplomatic',
  'security',
  'humanitarian',
  'economic',
  'legal_ihl',
  'human_rights',
  'development',
  'mediation',
  'climate_security',
] as const;

export type Lens = typeof LENSES[number];

export const ROLES = [
  'un_official', 'diplomat', 'think_tank', 'ngo', 'researcher',
  'journalist', 'private_sector', 'other',
] as const;
export type AnalystRole = typeof ROLES[number];

export const SENIORITIES = ['junior', 'mid', 'senior', 'executive'] as const;
export type Seniority = typeof SENIORITIES[number];

export const AUDIENCES = ['myself', 'team', 'senior_leadership', 'external_partners', 'public'] as const;
export type Audience = typeof AUDIENCES[number];

export const LANGUAGES = ['en', 'fr', 'es', 'ar', 'ru', 'zh'] as const;
export type Language = typeof LANGUAGES[number];

export const ANALYTICAL_STYLES = ['rapid_brief', 'deep_dive'] as const;
export type AnalyticalStyle = typeof ANALYTICAL_STYLES[number];

export const AnalystProfileSchema = z.object({
  identity: z.object({
    role: z.enum(ROLES),
    seniority: z.enum(SENIORITIES),
    org: z.string().max(120),
    team: z.string().max(120),
  }),
  perspective: z.object({
    mandate: z.string().max(600),
    lenses: z.array(z.enum(LENSES)).min(1).max(5),
    regions: z.array(z.string().max(80)).max(8),
    audience: z.enum(AUDIENCES),
  }),
  workingStyle: z.object({
    sourceCategories: z.array(z.string()).max(16),
    language: z.enum(LANGUAGES),
    redLines: z.array(z.string().max(240)).max(12),
    analyticalStyle: z.enum(ANALYTICAL_STYLES),
  }),
  meta: z.object({
    version: z.number().int().nonnegative(),
    completedAt: z.any().nullable(),
    lastEditedAt: z.any(),
    skipCount: z.number().int().nonnegative(),
    createdAt: z.any(),
  }),
  embedding: z.object({
    vector: z.array(z.number()).length(768).optional(),
    generatedAt: z.any().optional(),
    model: z.string().optional(),
  }).optional(),
});

export type AnalystProfile = z.infer<typeof AnalystProfileSchema>;

export const DEFAULT_ANALYST_PROFILE: AnalystProfile = {
  identity: { role: 'other', seniority: 'mid', org: '', team: '' },
  perspective: { mandate: '', lenses: ['diplomatic'], regions: [], audience: 'myself' },
  workingStyle: {
    sourceCategories: ['foundational', 'conflict-security', 'humanitarian', 'diplomatic-official', 'news-media'],
    language: 'en',
    redLines: [],
    analyticalStyle: 'rapid_brief',
  },
  meta: { version: 0, completedAt: null, lastEditedAt: null, skipCount: 0, createdAt: null },
};

/** A profile is "complete" only when the required perspective fields and identity are filled. */
export function isProfileComplete(p: AnalystProfile): boolean {
  return (
    p.identity.role !== 'other' || p.identity.org.trim().length > 0
  ) && p.perspective.mandate.trim().length >= 30
    && p.perspective.lenses.length >= 1
    && p.perspective.regions.length >= 1
    && !!p.perspective.audience;
}

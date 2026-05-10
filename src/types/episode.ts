/**
 * PRAXIS Situation Episode — chronology layer
 *
 * An Episode is one notable moment in a situation's history. Episodes form the
 * "<situation-episodes>" section injected into every AI tool's system prompt so
 * the model can reference named inflection points (e.g. "the 2023 ceasefire
 * collapse") rather than reinventing them each call.
 *
 * Stored at: users/{uid}/situations/{sid}/episodes/{episodeId}
 *
 * See: docs/superpowers/specs/2026-04-19-generic-route-production-readiness-design.md §6
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schema — used by /api/ai/extract-episodes (Output.object) and any
// client-side validation. Mirrors the Firestore document shape.
// ---------------------------------------------------------------------------

export const EpisodeSourceSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
});

export const EpisodeSchema = z.object({
  id: z.string(),
  title: z
    .string()
    .min(1)
    .max(100)
    .describe('Short headline for the episode (1–100 chars).'),
  date: z
    .string()
    .describe(
      'ISO 8601 date or partial ("2023", "2023-06", "2023-06-15"). Approximate OK.',
    ),
  dateConfidence: z.enum(['exact', 'month', 'year', 'approximate']),
  description: z
    .string()
    .describe('2–4 sentence neutral description of what happened.'),
  actors: z.array(z.string()).describe('Actor names or ids referenced.'),
  importance: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe('1=minor, 5=pivotal turning point.'),
  tags: z.array(z.string()).describe('Free-form tags e.g. "ceasefire", "coup".'),
  sources: z.array(EpisodeSourceSchema),
  extractedBy: z.enum(['user', 'ai', 'imported']),
  /**
   * Timestamp as an ISO-8601 string. Firestore `Timestamp` values are
   * serialised to this shape when read via the Admin SDK and returned over
   * the wire. Can be `null` when not yet populated.
   */
  extractedAt: z.string().nullable(),
  profileVersion: z.number().int().nonnegative(),
  domainVersion: z.number().int().nonnegative(),
  deletedAt: z.string().nullable(),
});

/**
 * The AI extraction schema — same as EpisodeSchema but without fields the
 * server fills in (id, extractedBy, extractedAt, profileVersion,
 * domainVersion, deletedAt). Used as the `Output.object({ schema })` target.
 */
export const ExtractedEpisodeSchema = EpisodeSchema.pick({
  title: true,
  date: true,
  dateConfidence: true,
  description: true,
  actors: true,
  importance: true,
  tags: true,
  sources: true,
});

export const ExtractEpisodesOutputSchema = z.object({
  episodes: z.array(ExtractedEpisodeSchema).min(0).max(12),
});

// ---------------------------------------------------------------------------
// TypeScript types
// ---------------------------------------------------------------------------

export type EpisodeSource = z.infer<typeof EpisodeSourceSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type ExtractedEpisode = z.infer<typeof ExtractedEpisodeSchema>;
export type ExtractEpisodesOutput = z.infer<typeof ExtractEpisodesOutputSchema>;

export type EpisodeStrand = 'situation' | 'work';

export interface ContextEpisode {
  id: string;
  caseId: string;
  episodeId: string;
  ownerUid: string;
  strand: EpisodeStrand;
  episodeType: string;
  title: string;
  validFrom: string;
  validTo?: string | null;
  graphSnapshotId?: string | null;
  metadata?: Record<string, unknown>;
}

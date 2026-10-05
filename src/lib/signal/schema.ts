import { z } from 'zod';
import { SIGNAL_COUNTRIES } from './geography';

const id = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const short = z.string().trim().min(1).max(240);
export const ScopeSchema = z.object({
  kind: z.enum(['country', 'region', 'theatre', 'thematic', 'administrative']),
  label: short,
  countries: z.array(z.string().refine(c => SIGNAL_COUNTRIES.some(x => x.code === c), 'Unknown country')).max(30),
}).strict().superRefine((s, ctx) => {
  if (s.kind === 'country' && s.countries.length !== 1) ctx.addIssue({ code: 'custom', message: 'Choose one country' });
  if (new Set(s.countries).size !== s.countries.length) ctx.addIssue({ code: 'custom', message: 'Duplicate country' });
});
export const FeedSchema = z.object({ url: z.string().url().max(2000), allowCapture: z.boolean(), basis: short, allowExport: z.boolean() }).strict();
export const DeskInputSchema = z.object({
  name: short, question: z.string().trim().min(5).max(2000), audience: short,
  scope: ScopeSchema, languages: z.array(z.string().trim().min(2).max(40)).min(1).max(10),
  windowDays: z.number().int().min(1).max(90).default(7),
  sourcePack: z.object({ id: id.default('supplied'), version: z.number().int().positive().default(1), feeds: z.array(FeedSchema).max(5).default([]), allowGdelt: z.boolean().default(false) }).strict().default({ id: 'supplied', version: 1, feeds: [], allowGdelt: false }),
}).strict();
export const CaptureSchema = z.object({
  title: short, text: z.string().min(1).max(16000), url: z.string().url().max(2000).optional(),
  language: z.string().min(2).max(40), kind: z.enum(['original_text', 'headline']).default('original_text'),
  // Analyst-declared country covered by the captured material, not publisher location.
  coverageCountry: z.string().refine(code => SIGNAL_COUNTRIES.some(country => country.code === code), 'Unknown coverage country').optional(),
  publicationTime: z.string().datetime().nullable().default(null),
  synthetic: z.boolean().default(false), rights: z.object({ basis: short, allowExport: z.boolean() }).strict(),
}).strict();
export const ProposalSchema = z.object({
  sourceRevisionId: id, proposition: z.string().trim().min(1).max(2000), speaker: short,
  quote: z.string().min(1).max(3000), start: z.number().int().nonnegative(), end: z.number().int().positive(),
  polarity: z.enum(['affirmative', 'negative', 'unknown']).default('unknown'),
  modality: z.enum(['asserted', 'alleged', 'conditional', 'proposed', 'denied', 'unknown']).default('unknown'),
  conditions: z.string().max(1000).default(''), time: z.string().max(240).default('unknown'),
  place: z.string().max(240).default('unknown'), frame: z.string().max(500).default('unassessed'),
}).strict();
export const FeedbackInputSchema = z.object({
  area: z.enum(['Overview', 'Coverage', 'Narratives', 'Evidence', 'Context', 'Briefs']),
  category: z.enum(['usability', 'visualization', 'source-coverage', 'evidence-review', 'brief-export', 'other']),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(5).max(1500),
  synthetic: z.boolean().default(false),
}).strict();
export type SignalFeedbackInput = z.infer<typeof FeedbackInputSchema>;
export interface SignalFeedback extends SignalFeedbackInput { id: string; actorUid: string; createdAt: string; deskVersion: number }
export type SignalScope = z.infer<typeof ScopeSchema>;
export type DeskInput = z.infer<typeof DeskInputSchema>;
export type CaptureInput = z.infer<typeof CaptureSchema>;
export type ProposalInput = z.infer<typeof ProposalSchema>;
export interface SignalSource extends CaptureInput { id: string; sourceId: string; hash: string; discoveredAt: string; capturedAt: string; publicationTimeReason: string | null; supersedes?: string; withdrawn?: boolean }
export interface SignalClaim extends ProposalInput { id: string; digest: string; evidenceHash: string; offsetUnit: 'utf16_code_unit'; status: 'proposed' | 'accepted' | 'rejected' | 'unresolved'; createdAt: string; stale?: boolean; activationEpoch?: number; contextDigest?: string | null; contextEpoch?: number; derivation?: Record<string, unknown> }
export interface SignalReview { id: string; targetId: string; digest: string; evidenceHash: string; contextDigest: string | null; decision: SignalClaim['status'] | 'approved'; rationale: string; reviewerUid: string; createdAt: string }
export interface SignalNarrative { id: string; version: number; title: string; frame: string; claimIds: string[]; alternatives: string[]; digest: string; status: 'proposed' | 'accepted' | 'rejected' | 'unresolved'; createdAt: string; stale?: boolean; previousId?: string }
export interface SignalAssessment { id: string; conclusion: string; changeReason: string; claimIds: string[]; alternatives: string[]; uncertainty: string; invalidators: string[]; digest: string; status: 'proposed' | 'accepted' | 'rejected' | 'unresolved'; createdAt: string; stale?: boolean; previousId: string | null; contextReceipt: unknown; sourcePackVersion: number }
export interface SignalBrief { id: string; text: string; digest: string; status: 'draft' | 'approved'; createdAt: string; approvedAt?: string; stale?: boolean; manifest: { deskVersion: number; sourcePackVersion: number; claimIds: string[]; claims: Array<{ id: string; digest: string; sourceRevisionId: string; evidenceHash: string }>; assessment?: SignalAssessment; narratives?: SignalNarrative[]; snapshots?: { desk: Pick<SignalDesk, 'id' | 'name' | 'question' | 'audience' | 'scope' | 'languages' | 'windowDays'>; claims: SignalClaim[]; reviews: SignalReview[]; sources: Array<Omit<SignalSource, 'text'>> }; contextReceipt: unknown; previousBriefId: string | null; synthetic: boolean; exportAllowed: boolean; limitations: string[] } }
export interface SignalRun { id: string; provider: string; status: 'running' | 'partial' | 'succeeded' | 'failed' | 'cancelled'; startedAt: string; endedAt?: string; count: number; saturated?: boolean; error?: string; query?: string; inputHash?: string; tokens?: number; model?: string }
export interface SignalDesk extends DeskInput { id: string; ownerUid: string; schemaVersion: 'signal/0.2'; version: number; createdAt: string; updatedAt: string; watched: boolean; budget: { maxCollectionsPerDay: number; maxAnalysesPerDay: number }; usage: { day: string; collections: number; analyses: number; tokens: number }; sources: SignalSource[]; sourceHeads?: Record<string, { revisionId: string; epoch: number }>; captures: Array<{ id: string; revisionId: string; capturedAt: string }>; claims: SignalClaim[]; reviews: SignalReview[]; briefs: SignalBrief[]; narratives?: SignalNarrative[]; assessments?: SignalAssessment[]; feedback?: SignalFeedback[]; runs: SignalRun[]; capsuleId?: string; contextReceipt?: unknown; contextText?: string; contextStale?: boolean; contextEpoch?: number; contextExportAllowed?: boolean; contextCapsuleIds?: string[]; deletionRequestedAt?: string }
export const pointer = id;

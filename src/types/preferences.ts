import { z } from 'zod';
import { ADVISOR_IDS } from './advisor';
import { LANGUAGES } from './analyst-profile';

export const CITATION_STYLES = ['un-footnote', 'apa', 'author-date', 'inline-links'] as const;
export const REPORT_LENGTHS = ['brief', 'standard', 'deep'] as const;
export const CONFIDENCE_LABELLING = ['icd-203', 'plain'] as const;
export const TIME_HORIZONS = ['30d', '90d', '180d', '365d'] as const;

const DailyBriefPreferencesSchema = z.object({
  enabled: z.boolean().default(false),
  capsuleId: z.string().min(1).max(240).nullable().default(null),
});

export const UserPreferencesSchema = z.object({
  citationStyle: z.enum(CITATION_STYLES),
  defaultReportLength: z.enum(REPORT_LENGTHS),
  defaultLanguage: z.enum(LANGUAGES),
  confidenceLabelling: z.enum(CONFIDENCE_LABELLING),
  defaultTimeHorizon: z.enum(TIME_HORIZONS),
  preferredAdvisor: z.enum(ADVISOR_IDS).nullable(),
  hiddenToolIds: z.array(z.string().min(1).max(80)).max(80).default([]),
  toolOrder: z.array(z.string().min(1).max(80)).max(120).default([]),
  dailyBrief: DailyBriefPreferencesSchema.default({ enabled: false, capsuleId: null }),
  updatedAt: z.any().nullable().default(null),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  citationStyle: 'un-footnote',
  defaultReportLength: 'standard',
  defaultLanguage: 'en',
  confidenceLabelling: 'icd-203',
  defaultTimeHorizon: '90d',
  preferredAdvisor: null,
  hiddenToolIds: [],
  toolOrder: [],
  dailyBrief: { enabled: false, capsuleId: null },
  updatedAt: null,
};

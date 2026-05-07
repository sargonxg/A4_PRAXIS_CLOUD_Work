import { z } from 'zod';

export const DraftExportSchema = z.object({
  title: z.string().min(1).max(240),
  format: z.enum(['markdown', 'docx', 'pdf']),
  audience: z.enum(['public', 'internal', 'restricted']),
  markdown: z.string().min(1).max(250_000),
  plainText: z.string().min(1).max(250_000),
  primaryMemoId: z.string().max(180).optional(),
  memoIds: z.array(z.string().max(180)).max(20).default([]),
  appendixIds: z.array(z.string().max(180)).max(80).default([]),
  coverPage: z.record(z.string(), z.string()).default({}),
  embedC2pa: z.boolean().default(true),
  embedAuditManifest: z.boolean().default(true),
  redactionSummary: z.record(z.string(), z.string()).default({}),
});

export type DraftExportInput = z.infer<typeof DraftExportSchema>;

export interface DraftExportRecord extends DraftExportInput {
  id: string;
  caseId: string;
  ownerUid: string;
  createdAt: string;
  artifactKind: 'draft-briefing-package';
  contentCredentials: {
    requested: boolean;
    signed: boolean;
    mode: 'c2pa-ready-manifest';
  };
  auditManifest: {
    embedded: boolean;
    generatedAt: string;
    checksum: string;
  };
}


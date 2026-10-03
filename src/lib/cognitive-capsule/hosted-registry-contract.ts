import { z } from 'zod';

export const RegistryNameSchema = z.string().min(3).max(200).regex(/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/);
export const RegistryVersionSchema = z.string().max(40).regex(/^\d+\.\d+\.\d+$/);
const versionRef = { name: RegistryNameSchema, version: RegistryVersionSchema };
export const HostedRegistryRequestSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('publish'), capsuleId: z.string().regex(/^[a-zA-Z0-9._:-]{1,160}$/), envelopeVersion: z.number().int().positive(), name: RegistryNameSchema }).strict(),
  z.object({ operation: z.literal('install'), ...versionRef }).strict(),
  z.object({ operation: z.literal('update'), ...versionRef, expectedDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/) }).strict(),
  z.object({ operation: z.literal('deprecate'), ...versionRef, reason: z.string().trim().min(1).max(600) }).strict(),
  z.object({ operation: z.literal('fork'), ...versionRef, newName: RegistryNameSchema }).strict(),
]);
export type HostedRegistryRequest = z.infer<typeof HostedRegistryRequestSchema>;
export interface HostedRegistryLock { name: string; version: string; digest: string; capsuleDigest: string }
export interface HostedRegistryInstallation extends HostedRegistryLock {
  ownerUid: string; lock: HostedRegistryLock[]; installedAt: string; updatedAt: string;
  promotion: 'not-promoted';
  draftCapsuleId: string; reviewCardId: string;
}
export interface HostedRegistryEntry extends HostedRegistryLock {
  ownerUid: string; sourceCapsuleId: string; sourceEnvelopeVersion: number;
  profile: string; publishedAt: string; deprecated?: string;
  rights: { mode: 'open' | 'private' | 'organization' | 'licensed'; license?: string; author?: string };
  dependencies: Array<{ name: string; version: string; digest: string }>;
  quality: { cognitiveDepth: number; evaluationPosture: string; structuralValidationPassed: boolean; dimensions: Record<string, number> };
  trust: { structuralValidation: 'passed'; factualTruthVerified: false; attestationPosture: 'not-signed'; humanReviewedRecords: number; proposedRecords: number };
  installed?: boolean;
}
export interface HostedRegistryList {
  entries: HostedRegistryEntry[]; installations: HostedRegistryInstallation[];
  nextCursor: string | null; hasMore: boolean; installationListingComplete: boolean;
  scope: 'owner-private';
}

import { z } from 'zod';

export const SpatialBoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const SpatialCitationRefSchema = z.object({
  cid: z.string().min(1),
  documentId: z.string().min(1),
  chunkId: z.string().min(1),
  sourceReceiptId: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  coords: SpatialBoundingBoxSchema.optional(),
  textPreview: z.string().min(1).max(500),
  quoteHash: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const DocumentLayoutChunkSchema = z.object({
  chunkId: z.string().min(1),
  pageNumber: z.number().int().positive().optional(),
  text: z.string().min(1),
  textStart: z.number().int().min(0).optional(),
  textEnd: z.number().int().min(0).optional(),
  coords: SpatialBoundingBoxSchema.optional(),
  citationRef: SpatialCitationRefSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const SpatialSourceBindingSchema = z.object({
  documentId: z.string().min(1),
  parser: z.enum(['document-ai-layout-parser', 'fallback-text']),
  parserVersion: z.string(),
  status: z.enum(['spatial', 'text-only', 'unavailable']),
  chunks: z.array(DocumentLayoutChunkSchema),
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type SpatialBoundingBox = z.infer<typeof SpatialBoundingBoxSchema>;
export type SpatialCitationRef = z.infer<typeof SpatialCitationRefSchema>;
export type DocumentLayoutChunk = z.infer<typeof DocumentLayoutChunkSchema>;
export type SpatialSourceBinding = z.infer<typeof SpatialSourceBindingSchema>;

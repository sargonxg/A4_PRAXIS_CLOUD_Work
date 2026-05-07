import { z } from 'zod';

const MemoryHitSchema = z.object({
  id: z.string().optional(),
  text: z.string(),
  score: z.number(),
  source_id: z.string().nullable().optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type MemoryHit = z.infer<typeof MemoryHitSchema>;

const MemoryCandidateSchema = z.object({
  id: z.string(),
  cognee_node_id: z.string().optional(),
  cogneeNodeId: z.string().optional(),
  cognee_dataset: z.string().optional(),
  confidence: z.union([z.number(), z.string()]).transform(Number),
  internal_score: z.union([z.number(), z.string()]).optional().transform((value) => value === undefined ? undefined : Number(value)),
  source_chunk_id: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  model: z.string().nullable().optional(),
  run_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  notes: z.string().nullable().optional(),
});

export type MemoryCandidate = z.infer<typeof MemoryCandidateSchema>;

export async function memoryRecall(args: {
  caseId: string;
  query: string;
  k?: number;
  sessionId?: string;
}): Promise<MemoryHit[]> {
  const res = await fetch('/api/memory/recall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case_id: args.caseId,
      query: args.query,
      k: args.k ?? 8,
      session_id: args.sessionId,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return z.array(MemoryHitSchema).parse(data.hits ?? []);
}

export async function memoryRemember(args: {
  caseId: string;
  content: string;
  source: 'document' | 'chat' | 'tool_output' | 'feed' | 'aco';
  sourceId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const res = await fetch('/api/memory/remember', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case_id: args.caseId,
      content: args.content,
      source: args.source,
      source_id: args.sourceId,
      session_id: args.sessionId,
      metadata: args.metadata ?? {},
    }),
  });
  return res.ok;
}

export async function memoryCandidates(caseId: string): Promise<MemoryCandidate[]> {
  const params = new URLSearchParams({ case_id: caseId });
  const res = await fetch(`/api/memory/candidates?${params.toString()}`, { method: 'GET' });
  if (!res.ok) return [];
  const data = await res.json();
  return z.array(MemoryCandidateSchema).parse(data.candidates ?? []);
}

export async function memoryReject(args: { caseId: string; linkId: string; notes?: string }): Promise<boolean> {
  const res = await fetch('/api/memory/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: args.caseId, link_id: args.linkId, notes: args.notes }),
  });
  return res.ok;
}

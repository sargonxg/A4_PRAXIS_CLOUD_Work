import { createHash } from 'node:crypto';
import type { FirewallReport } from '@/lib/api/with-firewall';

export interface ToolRunArtifactInput {
  uid: string;
  situationId: string;
  toolId: string;
  toolRunId?: string;
  prompt?: string;
  rawText?: string;
  structuredOutput?: Record<string, unknown>;
  contextDump?: Record<string, unknown>;
  firewall?: FirewallReport;
  metadata?: Record<string, unknown>;
}

export interface ToolRunArtifactRecord {
  id: string;
  uid: string;
  situationId: string;
  toolId: string;
  toolRunId: string;
  prompt: string | null;
  rawText: string | null;
  structuredOutput: Record<string, unknown>;
  contextDump: Record<string, unknown>;
  firewall: FirewallReport | null;
  metadata: Record<string, unknown>;
  schemaVersion: 'tool-run-artifact-v1';
  createdAt: string;
  updatedAt: string;
}

export interface ToolRunArtifactWriter {
  setArtifact(uid: string, situationId: string, artifactId: string, record: ToolRunArtifactRecord): Promise<void>;
}

function hashArtifact(input: ToolRunArtifactInput): string {
  return createHash('sha256')
    .update(`${input.uid}:${input.situationId}:${input.toolId}:${input.toolRunId ?? ''}:${input.prompt ?? ''}:${input.rawText ?? ''}`)
    .digest('hex')
    .slice(0, 32);
}

export function buildToolRunArtifact(input: ToolRunArtifactInput): ToolRunArtifactRecord {
  const now = new Date().toISOString();
  const toolRunId = input.toolRunId ?? `run_${hashArtifact(input).slice(0, 12)}`;
  return {
    id: hashArtifact({ ...input, toolRunId }),
    uid: input.uid,
    situationId: input.situationId,
    toolId: input.toolId,
    toolRunId,
    prompt: input.prompt?.trim() || null,
    rawText: input.rawText?.trim() || null,
    structuredOutput: input.structuredOutput ?? {},
    contextDump: input.contextDump ?? {},
    firewall: input.firewall ?? null,
    metadata: input.metadata ?? {},
    schemaVersion: 'tool-run-artifact-v1',
    createdAt: now,
    updatedAt: now,
  };
}

const firestoreToolRunArtifactWriter: ToolRunArtifactWriter = {
  async setArtifact(uid, situationId, artifactId, record) {
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    const db = getAdminDbOrThrow();
    await db
      .collection('users')
      .doc(uid)
      .collection('situations')
      .doc(situationId)
      .collection('toolRunArtifacts')
      .doc(artifactId)
      .set(record, { merge: true });
  },
};

export async function persistToolRunArtifact(
  input: ToolRunArtifactInput,
  writer: ToolRunArtifactWriter = firestoreToolRunArtifactWriter,
): Promise<{ persisted: boolean; artifactId: string; reason?: string }> {
  const record = buildToolRunArtifact(input);
  const hasPayload = Boolean(record.rawText) || Object.keys(record.structuredOutput).length > 0 || Object.keys(record.contextDump).length > 0;
  if (!hasPayload) return { persisted: false, artifactId: record.id, reason: 'empty_artifact' };
  await writer.setArtifact(record.uid, record.situationId, record.id, record);
  return { persisted: true, artifactId: record.id };
}

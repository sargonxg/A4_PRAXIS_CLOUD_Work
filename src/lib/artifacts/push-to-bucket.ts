/**
 * Client helper: push a generated artifact (HTML / markdown rendered to HTML)
 * to the PRAXIS GCS bucket via /api/documents/upload (JSON path).
 *
 * Tools that already persist outputs to Firestore via saveToolOutput should
 * still call this so the artifact appears in the Document Dashboard and
 * /app/library, with a copy in the durable bucket. Demo mode resolves to a
 * no-op simulated URI; live mode writes to the configured bucket.
 */

export interface PushArtifactArgs {
  documentId: string;
  title: string;
  html: string;
  situationId: string;
  toolId: string;
  contentType?: string;
}

export interface PushArtifactResult {
  success: boolean;
  uri?: string;
  message?: string;
  mode?: 'demo-noop' | 'json' | 'fallback';
}

export async function pushArtifactToBucket(
  args: PushArtifactArgs,
): Promise<PushArtifactResult> {
  try {
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return {
        success: false,
        message: body.error || `HTTP ${res.status}`,
        mode: 'fallback',
      };
    }
    const data = (await res.json()) as PushArtifactResult;
    return { ...data, success: true };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Bucket push failed',
      mode: 'fallback',
    };
  }
}

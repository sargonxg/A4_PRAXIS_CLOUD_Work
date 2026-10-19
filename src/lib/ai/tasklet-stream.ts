/** Decode UTF-8 and protocol lines independently of HTTP chunk boundaries. */
export function createTaskletStreamDecoder() {
  const decoder = new TextDecoder();
  let pending = '';
  function drain(final: boolean): string[] {
    const lines = pending.split('\n');
    pending = final ? '' : lines.pop() ?? '';
    return lines.map(line => line.endsWith('\r') ? line.slice(0, -1) : line).filter(Boolean);
  }
  return {
    push(chunk: Uint8Array): string[] {
      pending += decoder.decode(chunk, { stream: true });
      return drain(false);
    },
    finish(): string[] {
      pending += decoder.decode();
      return drain(true);
    },
  };
}

export function parseDataStreamError(line: string): string | null {
  if (!line.startsWith('3:')) return null;
  try {
    const parsed = JSON.parse(line.slice(2)) as unknown;
    if (typeof parsed === 'string' && parsed.trim()) return parsed;
    if (isRecord(parsed)) {
      const error = stringField(parsed.error) ?? stringField(parsed.message);
      if (error) return error;
    }
    return 'Ask PRAXIS stream failed.';
  } catch {
    return 'Ask PRAXIS stream failed.';
  }
}

export function describeAskFailure(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('412') || lower.includes('capsule_context') || lower.includes('contextcapsule') || lower.includes('capsule context')) {
    return `Ask PRAXIS could not resolve the active ContextCapsule for this turn. Select or repair a capsule, then retry. Your prompt is still in the composer.\n\nFailure detail: ${message}`;
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('auth') || lower.includes('session') || lower.includes('token')) {
    return `Ask PRAXIS could not use your current session. Sign in again or refresh the workspace, then retry. Your prompt is still in the composer.\n\nFailure detail: ${message}`;
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('body') || lower.includes('timeout') || lower.includes('stream')) {
    return `Ask PRAXIS hit a network or streaming interruption before the answer completed. Your prompt is still in the composer for retry.\n\nFailure detail: ${message}`;
  }
  if (lower.includes('model') || lower.includes('api') || lower.includes('vertex') || lower.includes('gemini') || lower.includes('generate')) {
    return `Ask PRAXIS reached the model/API layer but the answer failed. Try again, or switch runtime depth if the model is unavailable. Your prompt is still in the composer.\n\nFailure detail: ${message}`;
  }
  return `Ask PRAXIS could not finish the answer. Your prompt is still in the composer, and the active capsule context was not changed.\n\nFailure detail: ${message}`;
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

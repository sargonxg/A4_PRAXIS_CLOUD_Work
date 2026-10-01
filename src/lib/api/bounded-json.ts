export class BoundedJsonError extends Error {
  constructor(readonly code: string, message: string, readonly status: 400 | 413) {
    super(message);
    this.name = 'BoundedJsonError';
  }
}

/** Enforce bytes while reading, then bound parsed text and nesting before work. */
export async function readBoundedJson(request: Request, limits: { maxBytes: number; maxTextChars: number }): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new BoundedJsonError('malformed_json', 'Send a valid JSON request.', 400);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limits.maxBytes) {
        await reader.cancel();
        throw new BoundedJsonError('request_payload_too_large', 'This request is too large. Use fewer documents or shorter notes.', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const contents = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { contents.set(chunk, offset); offset += chunk.byteLength; }
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder().decode(contents)); }
  catch { throw new BoundedJsonError('malformed_json', 'Send a valid JSON request.', 400); }
  const remaining = [{ value: parsed, depth: 0 }];
  let textChars = 0;
  while (remaining.length) {
    const next = remaining.pop()!;
    if (next.depth > 32) throw new BoundedJsonError('request_structure_too_deep', 'This request has too many nested fields.', 400);
    if (typeof next.value === 'string') textChars += next.value.length;
    else if (next.value && typeof next.value === 'object') {
      for (const value of Object.values(next.value)) remaining.push({ value, depth: next.depth + 1 });
    }
    if (textChars > limits.maxTextChars) throw new BoundedJsonError('request_text_too_large', 'This request has too much text. Use fewer documents or shorter notes.', 413);
  }
  return parsed;
}

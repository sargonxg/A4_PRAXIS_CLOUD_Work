/** Links open original sources; generated summaries are never presented as retrieved passages. */
export function memoOriginalSourceUrl(source: Record<string, unknown>): string | null {
  for (const candidate of [source.finalUrl, source.url, source.originalUrl, source.sourceUrl]) {
    if (typeof candidate !== 'string') continue;
    try {
      const url = new URL(candidate);
      if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href;
    } catch { /* An invalid URL is not a source link. */ }
  }
  return null;
}

export function memoSourceStatus(source: Record<string, unknown>): string {
  if (source.originalPassageStatus === 'retrieved') return 'Original passage retrieved; claim support needs review.';
  if (source.originalPassageStatus === 'unavailable') return 'Original passage unavailable; inspect the source directly.';
  if (source.kind === 'document' || source.retrievalMethod === 'user_upload') return 'Uploaded document excerpt; inspect the original document.';
  return 'Source preview; original passage has not been verified.';
}

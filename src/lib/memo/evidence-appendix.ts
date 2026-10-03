import { readMemoContextSnapshot } from './context-snapshot';
import { createHash } from 'node:crypto';

// Server-owned allowlist of the full, redistributable Example Advisory fixture.
// Tests bind these hashes to the shared fixture; a caller's rights label grants nothing.
const syntheticSources: Record<string, { version: number; hash: string }> = {
  'EA-D1': { version: 1, hash: 'e211bf25cb87a9c751bb31537bc413357fc539182189cfd43b3370b7dd391354' },
  'EA-D8': { version: 1, hash: '9fa1bf1f66e13a78349dc09b241f7274b2a8e368bf4ddb54d7cd771ca7464eb3' },
  'EA-D15': { version: 2, hash: 'c9a18e22182b9896e573620bfd50222e30549557ac034005a5bc4f6721eb8df3' },
};

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function label(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value).replace(/[\r\n]/g, ' ').slice(0, 1000).replace(/[\\`*_{}[\]<>#]/g, '\\$&') : 'Unknown';
}

function sourceLocator(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    // Never export bearer/signed credentials from source URLs. Unknown query
    // semantics stay reference-only rather than silently changing the locator.
    if ([...url.searchParams.keys()].some((key) => !['id', 'page', 'section', 'lang'].includes(key))) return null;
    if (url.hash && !/^#(?:page|section)(?:=|-)[a-zA-Z0-9_-]{1,80}$/.test(url.hash)) return null;
    // Labels are bounded to 1,000 characters. Withhold an oversized locator
    // explicitly instead of exporting a truncated URL that resolves elsewhere.
    if (url.href.length > 1000) return null;
    return url.href;
  } catch { return null; }
}

/** Export only the selected version's recorded evidence; never fetch newer context. */
export function memoEvidenceAppendix(value: unknown): string {
  const snapshot = readMemoContextSnapshot(value);
  const lines = ['## Evidence appendix', '', 'Recorded references describe lineage; they do not certify support for every edited claim.'];
  if (!snapshot || snapshot.binding !== 'recorded') return [...lines, 'This legacy version has no bound evidence snapshot. Source access and claim support require separate review.'].join('\n');
  lines.push(`Context: ${snapshot.capsuleId ? `${label(snapshot.capsuleId)} · v${snapshot.capsuleVersion}` : 'No saved capsule attached'}`);
  if (snapshot.runId) lines.push(`Originating run: ${label(snapshot.runId)}`);
  if (!snapshot.sourceReceiptIds.length) lines.push('No source references recorded.');
  for (const id of snapshot.sourceReceiptIds) {
    const matches = snapshot.sourceReceipts.map(object).filter((receipt) => receipt.sourceReceiptId === id);
    lines.push('', `### Source ${label(id)}`);
    if (matches.length !== 1) {
      lines.push('Unresolved: no unique stored source receipt. Obtain the original source separately.');
      continue;
    }
    const receipt = matches[0];
    const passage = object(receipt.passage);
    if (receipt.title !== undefined) lines.push(`Source title: ${label(receipt.title)}`);
    const locator = sourceLocator(receipt.url);
    lines.push(locator ? `Source URL: ${label(locator)}` : 'Source URL: missing or redacted; obtain authorized access separately.');
    if (receipt.documentId !== undefined) lines.push(`Private document reference: ${label(receipt.documentId)} (requires separate access)`);
    lines.push(`Source version: ${label(receipt.sourceVersion)}`, `Content hash: ${label(receipt.contentHash)}`,
      `Publication date: ${label(receipt.publishedDate)}`, `Source language: ${label(receipt.language)}`,
      `Rights: ${label(receipt.rights)}`);
    if (passage.pageRef !== undefined) lines.push(`Page: ${label(passage.pageRef)}`);
    if (passage.sectionRef !== undefined) lines.push(`Section: ${label(passage.sectionRef)}`);
    if (passage.paragraphRef !== undefined) lines.push(`Paragraph: ${label(passage.paragraphRef)}`);
    if (Number.isSafeInteger(passage.charStart) && Number.isSafeInteger(passage.charEnd)
      && Number(passage.charStart) >= 0 && Number(passage.charEnd) > Number(passage.charStart)) {
      lines.push(`Text anchor: characters ${passage.charStart}–${passage.charEnd} of the recorded source version`);
    } else lines.push('Text anchor: unresolved; obtain the original source separately.');
    // Only the explicitly redistributable synthetic fixture is included by this profile.
    // Public availability or an arbitrary rights string is not redistribution permission.
    const known = Object.hasOwn(syntheticSources, id) ? syntheticSources[id] : undefined;
    const quote = passage.quote;
    const permittedSynthetic = known && receipt.sourceVersion === known.version && receipt.contentHash === known.hash
      && typeof quote === 'string' && passage.charStart === 0 && passage.charEnd === quote.length
      && createHash('sha256').update(quote).digest('hex') === known.hash;
    if (permittedSynthetic && typeof quote === 'string') {
      const fence = '`'.repeat(Math.max(3, ...[...quote.matchAll(/`+/g)].map((match) => match[0].length + 1)));
      lines.push('Included synthetic source-language passage:', `${fence}text`, quote, fence);
    } else lines.push('Reference only: source text omitted. The recipient needs separate authorized source access.');
  }
  if (snapshot.unsupportedClaims.length) lines.push('', '### Recorded evidence gaps', ...snapshot.unsupportedClaims.map((claim) => `- ${label(claim)}`));
  return lines.join('\n');
}

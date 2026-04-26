export interface MediaSearchQueryInput {
  keywords: string[];
  exactPhrases?: string[];
  excludeTerms?: string[];
  domains?: string[];
  since?: string;
  until?: string;
  language?: string;
}

function cleanToken(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function quote(value: string): string {
  return `"${cleanToken(value).replace(/"/g, '\\"')}"`;
}

export function buildAdvancedMediaSearchQuery(input: MediaSearchQueryInput): string {
  const keywords = input.keywords.map(cleanToken).filter(Boolean);
  const phrases = (input.exactPhrases ?? []).map(cleanToken).filter(Boolean);
  const excludes = (input.excludeTerms ?? []).map(cleanToken).filter(Boolean);
  const domains = (input.domains ?? []).map(cleanToken).filter(Boolean);

  const parts: string[] = [];
  if (keywords.length) parts.push(`(${keywords.join(' OR ')})`);
  if (phrases.length) parts.push(phrases.map(quote).join(' OR '));
  if (domains.length) parts.push(`(${domains.map((domain) => `site:${domain}`).join(' OR ')})`);
  if (input.since) parts.push(`after:${input.since}`);
  if (input.until) parts.push(`before:${input.until}`);
  if (input.language) parts.push(`lang:${cleanToken(input.language)}`);
  parts.push(...excludes.map((term) => `-${quote(term)}`));

  return parts.join(' ').trim();
}

export function buildSituationMediaKeywords(situation: {
  name?: string;
  region?: string;
  actors?: string[];
}): string[] {
  return [
    situation.name,
    situation.region,
    ...(situation.actors ?? []),
  ].filter((value): value is string => Boolean(value && value.trim()));
}

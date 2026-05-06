import { searchReports } from '@/lib/data-feeds/reliefweb-client';
import { searchArticles } from '@/lib/data-feeds/gdelt-client';
import {
  SYRIA_SOURCE_LIBRARY,
  type SyriaSourceDefinition,
} from './source-library';

export interface SyriaIngestDocument {
  sourceId: string;
  sourceName: string;
  tier: string;
  title: string;
  url: string;
  text: string;
  retrievedAt: string;
  retrievalMethod: 'grounded_search' | 'Grounded Search' | 'feed' | 'upload' | 'manual';
  provenance: {
    sourceId: string;
    sourceUrl: string;
    retrievedAt: string;
    retrievalMethod: 'grounded_search' | 'Grounded Search' | 'feed' | 'upload' | 'manual';
    live: boolean;
  };
}

const FALLBACK_DATE = '2026-05-01T00:00:00.000Z';

export const SYRIA_CACHED_FALLBACK_DOCUMENTS: SyriaIngestDocument[] = [
  fallbackDoc('un-geneva', 'UN Syria transition briefing packet', 'UN reporting frames the Syria transition around implementation risk, humanitarian access, protection guarantees, and the Damascus-SDF integration track. Analysts should treat this as a first-party political baseline, then compare it with local reporting and humanitarian field updates.'),
  fallbackDoc('reliefweb-syria', 'ReliefWeb Syria humanitarian roundup', 'Humanitarian reporting highlights displacement, protection, access, and basic-service constraints. PRAXIS uses this as the humanitarian evidence layer for commitment checks and briefing generation.'),
  fallbackDoc('gdelt-syria', 'GDELT Syria media-event signal', 'Media-event monitoring indicates that Syria coverage clusters around security incidents, sanctions, Israeli strikes, transition governance, returns, and northeast integration issues.'),
  fallbackDoc('enab-baladi', 'Enab Baladi local-source lens', 'Local Syrian reporting is used to identify ground-level discrepancies against official narratives, especially around services, arrests, security incidents, and local governance.'),
  fallbackDoc('syria-direct', 'Syria Direct investigative lens', 'Independent reporting supplies human-source texture on governance, aid, property, return, and security dynamics that official communiques often under-specify.'),
  fallbackDoc('north-press', 'North Press northeast Syria lens', 'Northeast-specialist reporting is especially relevant for SDF integration, detention facilities, counter-ISIL equities, and local Arab-Kurdish political dynamics.'),
  fallbackDoc('crisis-group-syria', 'Crisis Group policy analysis lens', 'Think-tank analysis is included as a policy-options layer, not as canonical fact. PRAXIS compares its claims to primary UN and local-source reporting.'),
  fallbackDoc('carnegie-mec-syria', 'Carnegie regional analysis lens', 'Regional analysis helps separate stated positions from inferred interests among Damascus, regional states, external patrons, and international organizations.'),
];

function fallbackDoc(sourceId: string, title: string, text: string): SyriaIngestDocument {
  const source = sourceById(sourceId);
  return {
    sourceId,
    sourceName: source.name,
    tier: source.tier,
    title,
    url: source.url,
    text,
    retrievedAt: FALLBACK_DATE,
    retrievalMethod: source.retrievalMethod,
    provenance: {
      sourceId,
      sourceUrl: source.url,
      retrievedAt: FALLBACK_DATE,
      retrievalMethod: source.retrievalMethod,
      live: false,
    },
  };
}

export async function collectSyriaIngestDocuments(options: { live?: boolean; limit?: number } = {}): Promise<SyriaIngestDocument[]> {
  if (!options.live) return SYRIA_CACHED_FALLBACK_DOCUMENTS.slice(0, options.limit ?? 8);
  const docs: SyriaIngestDocument[] = [];
  const retrievedAt = new Date().toISOString();

  const [reliefweb, gdelt] = await Promise.all([
    searchReports({ country: 'Syrian Arab Republic', query: 'Syria', limit: 4, dateStart: daysAgo(7) }).catch(() => []),
    searchArticles({ query: 'Syria Damascus SDF OR humanitarian OR transition', timespan: '7d', maxRecords: 4 }).catch(() => []),
  ]);

  const reliefwebSource = sourceById('reliefweb-syria');
  reliefweb.forEach((report) => {
    docs.push(normalizeDocument(reliefwebSource, {
      title: report.title,
      url: report.url,
      text: [report.title, report.source, report.date, report.body].filter(Boolean).join('\n'),
      retrievedAt,
      live: true,
    }));
  });

  const gdeltSource = sourceById('gdelt-syria');
  gdelt.forEach((article) => {
    docs.push(normalizeDocument(gdeltSource, {
      title: article.title,
      url: article.url,
      text: `${article.title}\nDomain: ${article.domain}\nLanguage: ${article.language}\nSeen: ${article.seendate}\nTone: ${article.tone}`,
      retrievedAt,
      live: true,
    }));
  });

  const merged = [...docs, ...SYRIA_CACHED_FALLBACK_DOCUMENTS].slice(0, options.limit ?? 12);
  return dedupeByUrl(merged);
}

function normalizeDocument(source: SyriaSourceDefinition, input: { title: string; url: string; text: string; retrievedAt: string; live: boolean }): SyriaIngestDocument {
  return {
    sourceId: source.id,
    sourceName: source.name,
    tier: source.tier,
    title: input.title || source.name,
    url: input.url || source.url,
    text: input.text.slice(0, source.maxExcerptChars),
    retrievedAt: input.retrievedAt,
    retrievalMethod: source.retrievalMethod,
    provenance: {
      sourceId: source.id,
      sourceUrl: source.url,
      retrievedAt: input.retrievedAt,
      retrievalMethod: source.retrievalMethod,
      live: input.live,
    },
  };
}

function sourceById(sourceId: string): SyriaSourceDefinition {
  const source = SYRIA_SOURCE_LIBRARY.find((item) => item.id === sourceId);
  if (!source) throw new Error(`Unknown Syria source: ${sourceId}`);
  return source;
}

function dedupeByUrl(docs: SyriaIngestDocument[]): SyriaIngestDocument[] {
  const seen = new Set<string>();
  return docs.filter((doc) => {
    const key = doc.url || doc.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

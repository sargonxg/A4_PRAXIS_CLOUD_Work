import { retrieveRelevantChunks } from '@/lib/firebase/documents-service';
import { getToolData } from '@/lib/firebase/tool-data-service';

export interface ArgusCorpusContextInput {
  uid: string;
  situationId: string;
  query: string;
  maxChars?: number;
}

function truncate(value: string, maxChars: number): string {
  return value.length > maxChars ? `${value.slice(0, maxChars - 1)}…` : value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function formatArgusData(data: unknown): string {
  const d = asRecord(data);
  const lines: string[] = [];

  const threat = typeof d.overallThreatLevel === 'string' ? d.overallThreatLevel : null;
  if (threat) lines.push(`Overall threat level: ${threat}`);

  const alerts = Array.isArray(d.alerts) ? d.alerts.slice(0, 5) : [];
  if (alerts.length) {
    lines.push('ARGUS alerts:');
    for (const raw of alerts) {
      const alert = asRecord(raw);
      const title = typeof alert.title === 'string' ? alert.title : 'Untitled alert';
      const severity = typeof alert.severity === 'string' ? alert.severity : 'unknown';
      const signal = typeof alert.signal === 'string' ? alert.signal : '';
      const evidence = typeof alert.evidence === 'string' ? alert.evidence : '';
      const source = typeof alert.source === 'string' ? alert.source : '';
      lines.push(`- [${severity}] ${title}${source ? ` (${source})` : ''}: ${signal}${evidence ? ` Evidence: ${evidence}` : ''}`);
    }
  }

  const watchItems = Array.isArray(d.watchItems) ? d.watchItems.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  if (watchItems.length) {
    lines.push('ARGUS watch items:');
    lines.push(...watchItems.map((item) => `- ${item}`));
  }

  return lines.join('\n');
}

function formatSourcesLibrary(data: unknown): string {
  const sources = Array.isArray(data) ? data.slice(0, 8) : [];
  if (!sources.length) return '';

  const lines = ['User saved sources:'];
  for (const raw of sources) {
    const source = asRecord(raw);
    const name = typeof source.name === 'string' ? source.name : typeof source.title === 'string' ? source.title : 'Untitled source';
    const url = typeof source.url === 'string' ? source.url : typeof source.domain === 'string' ? source.domain : '';
    const reliability = typeof source.reliability === 'number' ? ` reliability ${source.reliability}/10` : '';
    lines.push(`- ${name}${url ? ` — ${url}` : ''}${reliability}`);
  }
  return lines.join('\n');
}

export async function buildAskPraxisCorpusContext(input: ArgusCorpusContextInput): Promise<string> {
  const maxChars = input.maxChars ?? 9000;
  const sections: string[] = [];

  const [argusData, sourcesData, chunks] = await Promise.all([
    getToolData(input.uid, input.situationId, 'argus').catch(() => null),
    getToolData(input.uid, input.situationId, 'sources-library').catch(() => null),
    retrieveRelevantChunks(input.uid, input.situationId, input.query, { maxChunks: 4 }).catch(() => []),
  ]);

  const argusText = formatArgusData(argusData?.data);
  if (argusText) sections.push(`## ARGUS Situation Corpus\n${argusText}`);

  const sourcesText = formatSourcesLibrary(sourcesData?.data);
  if (sourcesText) sections.push(`## Source Library\n${sourcesText}`);

  if (chunks.length) {
    sections.push(`## Relevant Document Excerpts\n${chunks.map((chunk) =>
      `[Source: ${chunk.documentTitle}]\n${chunk.text}`
    ).join('\n\n---\n\n')}`);
  }

  const corpus = sections.join('\n\n');
  return corpus ? truncate(corpus, maxChars) : '';
}

export const __test__ = {
  formatArgusData,
  formatSourcesLibrary,
};

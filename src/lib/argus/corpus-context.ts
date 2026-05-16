interface ArgusAlert {
  title: string;
  severity: string;
  signal: string;
  evidence?: string;
  source?: string;
}

function formatArgusData(input: { overallThreatLevel?: string; alerts?: ArgusAlert[]; watchItems?: string[] }): string {
  const lines = [`Overall threat level: ${input.overallThreatLevel ?? 'unknown'}`];
  for (const alert of input.alerts ?? []) {
    lines.push(`[${alert.severity}] ${alert.title}: ${alert.signal}${alert.source ? ` (${alert.source})` : ''}`);
  }
  if (input.watchItems?.length) lines.push(`Watch items: ${input.watchItems.join('; ')}`);
  return lines.join('\n');
}

function formatSourcesLibrary(sources: Array<{ name?: string; title?: string; url?: string; domain?: string; reliability?: number }>): string {
  return sources
    .map((source) => {
      const label = source.name ?? source.title ?? 'Untitled source';
      const locator = source.url ?? source.domain ?? 'no locator';
      const reliability = typeof source.reliability === 'number' ? ` reliability ${source.reliability}/10` : '';
      return `${label} — ${locator}${reliability}`;
    })
    .join('\n');
}

export const __test__ = { formatArgusData, formatSourcesLibrary };

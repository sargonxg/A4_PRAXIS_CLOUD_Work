export type SyriaSourceTier = 'primary-un' | 'humanitarian' | 'conflict-data' | 'local-independent' | 'regional-analysis' | 'wire' | 'think-tank';
export type SyriaRetrievalMethod = 'grounded_search' | 'firecrawl' | 'feed' | 'upload' | 'manual';

export interface SyriaSourceDefinition {
  id: string;
  tier: SyriaSourceTier;
  name: string;
  url: string;
  retrievalMethod: SyriaRetrievalMethod;
  why: string;
  maxExcerptChars: number;
  liveEnabled: boolean;
}

export const SYRIA_SOURCE_LIBRARY: SyriaSourceDefinition[] = [
  { id: 'un-geneva', tier: 'primary-un', name: 'UN Geneva press briefings', url: 'https://www.ungeneva.org/en/news-media', retrievalMethod: 'grounded_search', why: 'First-party UN reporting and briefings mentioning Syria.', maxExcerptChars: 1200, liveEnabled: false },
  { id: 'un-special-envoy', tier: 'primary-un', name: 'UN Special Envoy for Syria', url: 'https://specialenvoysyria.unmissions.org/', retrievalMethod: 'feed', why: 'Official envoy statements, briefings, and political process updates.', maxExcerptChars: 1200, liveEnabled: false },
  { id: 'ocha-syria', tier: 'primary-un', name: 'OCHA Syria', url: 'https://www.unocha.org/syrian-arab-republic', retrievalMethod: 'feed', why: 'Humanitarian situation reports and access updates.', maxExcerptChars: 1400, liveEnabled: false },
  { id: 'unhcr-syria', tier: 'primary-un', name: 'UNHCR Syria', url: 'https://www.unhcr.org/sy/', retrievalMethod: 'feed', why: 'Returns, displacement, and protection reporting.', maxExcerptChars: 1200, liveEnabled: false },
  { id: 'unfpa-arab-syria', tier: 'primary-un', name: 'UNFPA Arab States Syria', url: 'https://arabstates.unfpa.org/en/syria', retrievalMethod: 'feed', why: 'Gender, protection, health, and regional humanitarian reporting.', maxExcerptChars: 1000, liveEnabled: false },
  { id: 'un-cca-syria', tier: 'primary-un', name: 'UN Common Country Analysis Syria', url: 'https://syria.un.org/en/312773-common-country-analysis-syria', retrievalMethod: 'manual', why: 'Integrated annual transition and development analysis.', maxExcerptChars: 1000, liveEnabled: false },
  { id: 'reliefweb-syria', tier: 'humanitarian', name: 'ReliefWeb Syria', url: 'https://reliefweb.int/country/syr', retrievalMethod: 'feed', why: 'Broad humanitarian aggregator with NGO and UN sitreps.', maxExcerptChars: 1400, liveEnabled: true },
  { id: 'ucdp-syria', tier: 'conflict-data', name: 'UCDP GED Syria', url: 'https://ucdp.uu.se/country/652', retrievalMethod: 'feed', why: 'Structured conflict-event corroboration.', maxExcerptChars: 800, liveEnabled: false },
  { id: 'gdelt-syria', tier: 'conflict-data', name: 'GDELT Syria media events', url: 'https://www.gdeltproject.org/', retrievalMethod: 'feed', why: 'Media-event volume and source diversity.', maxExcerptChars: 1000, liveEnabled: true },
  { id: 'enab-baladi', tier: 'local-independent', name: 'Enab Baladi English', url: 'https://english.enabbaladi.org/', retrievalMethod: 'grounded_search', why: 'Syrian diaspora newsroom with local-source reporting.', maxExcerptChars: 900, liveEnabled: false },
  { id: 'syria-direct', tier: 'local-independent', name: 'Syria Direct', url: 'https://syriadirect.org/', retrievalMethod: 'grounded_search', why: 'Independent investigative reporting and local interviews.', maxExcerptChars: 900, liveEnabled: false },
  { id: 'north-press', tier: 'local-independent', name: 'North Press Agency', url: 'https://npasyria.com/en/', retrievalMethod: 'grounded_search', why: 'Northeast Syria specialist reporting.', maxExcerptChars: 900, liveEnabled: false },
  { id: 'syria-report', tier: 'local-independent', name: 'The Syria Report', url: 'https://syria-report.com/', retrievalMethod: 'manual', why: 'Economy, HLP, governance, and reconstruction reporting.', maxExcerptChars: 600, liveEnabled: false },
  { id: 'al-monitor-syria', tier: 'regional-analysis', name: 'Al-Monitor Syria', url: 'https://www.al-monitor.com/section/syria', retrievalMethod: 'grounded_search', why: 'Regional diplomacy and political analysis.', maxExcerptChars: 600, liveEnabled: false },
  { id: 'reuters-syria', tier: 'wire', name: 'Reuters Syria', url: 'https://www.reuters.com/world/middle-east/', retrievalMethod: 'grounded_search', why: 'Daily wire coverage and diplomatic developments.', maxExcerptChars: 500, liveEnabled: false },
  { id: 'ap-syria', tier: 'wire', name: 'Associated Press Syria', url: 'https://apnews.com/hub/syria', retrievalMethod: 'grounded_search', why: 'Daily wire coverage and field reporting.', maxExcerptChars: 500, liveEnabled: false },
  { id: 'crisis-group-syria', tier: 'think-tank', name: 'Crisis Group Syria', url: 'https://www.crisisgroup.org/middle-east-north-africa/syria', retrievalMethod: 'grounded_search', why: 'Long-form conflict analysis and policy options.', maxExcerptChars: 500, liveEnabled: false },
  { id: 'carnegie-mec-syria', tier: 'think-tank', name: 'Carnegie Middle East Syria', url: 'https://carnegie-mec.org/regions/?lang=en', retrievalMethod: 'grounded_search', why: 'Regional policy analysis and governance commentary.', maxExcerptChars: 500, liveEnabled: false },
];

export const SYRIA_INGEST_USER_AGENT = 'PRAXIS/6.5 (https://praxis.tacitus.me; contact@tacitus.me)';
export const SYRIA_INGEST_PURPOSE_HEADER = 'research';

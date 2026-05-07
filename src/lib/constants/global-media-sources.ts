/**
 * Global media source database — baseline for all situations.
 * Users can add/remove/customize per situation.
 */

export interface MediaSource {
  id: string;
  name: string;
  type: 'wire' | 'broadsheet' | 'broadcast' | 'think-tank' | 'government' | 'regional' | 'state-media' | 'investigative' | 'academic';
  region: string;
  reliability: number; // 0-1
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'state-aligned' | 'independent';
  url: string;
  specialties: string[];
  notes?: string;
}

export const GLOBAL_MEDIA_SOURCES: MediaSource[] = [
  // Wire Services (highest reliability)
  { id: 'reuters', name: 'Reuters', type: 'wire', region: 'Global', reliability: 0.95, bias: 'center', url: 'reuters.com', specialties: ['breaking news', 'conflict', 'economics'] },
  { id: 'ap', name: 'Associated Press', type: 'wire', region: 'Global', reliability: 0.95, bias: 'center', url: 'apnews.com', specialties: ['breaking news', 'conflict', 'US foreign policy'] },
  { id: 'afp', name: 'Agence France-Presse', type: 'wire', region: 'Global', reliability: 0.93, bias: 'center', url: 'afp.com', specialties: ['breaking news', 'Africa', 'Middle East'] },

  // Broadsheets
  { id: 'nyt', name: 'New York Times', type: 'broadsheet', region: 'US', reliability: 0.88, bias: 'center-left', url: 'nytimes.com', specialties: ['investigative', 'foreign affairs', 'policy'] },
  { id: 'wapo', name: 'Washington Post', type: 'broadsheet', region: 'US', reliability: 0.87, bias: 'center-left', url: 'washingtonpost.com', specialties: ['US policy', 'national security', 'leaks'] },
  { id: 'ft', name: 'Financial Times', type: 'broadsheet', region: 'UK', reliability: 0.90, bias: 'center', url: 'ft.com', specialties: ['economics', 'sanctions', 'trade'] },
  { id: 'guardian', name: 'The Guardian', type: 'broadsheet', region: 'UK', reliability: 0.85, bias: 'center-left', url: 'theguardian.com', specialties: ['human rights', 'environment', 'conflict'] },
  { id: 'economist', name: 'The Economist', type: 'broadsheet', region: 'UK', reliability: 0.88, bias: 'center', url: 'economist.com', specialties: ['political economy', 'conflict analysis', 'forecasting'] },
  { id: 'lemonde', name: 'Le Monde', type: 'broadsheet', region: 'France', reliability: 0.87, bias: 'center-left', url: 'lemonde.fr', specialties: ['Africa', 'EU policy', 'diplomacy'] },

  // Broadcast
  { id: 'bbc', name: 'BBC News', type: 'broadcast', region: 'UK', reliability: 0.88, bias: 'center', url: 'bbc.com', specialties: ['global coverage', 'Africa', 'conflict'] },
  { id: 'aljazeera', name: 'Al Jazeera', type: 'broadcast', region: 'Qatar', reliability: 0.80, bias: 'center', url: 'aljazeera.com', specialties: ['Middle East', 'Global South', 'conflict'], notes: 'Strong Middle East coverage, some editorial bias on Gulf politics' },
  { id: 'dw', name: 'Deutsche Welle', type: 'broadcast', region: 'Germany', reliability: 0.85, bias: 'center', url: 'dw.com', specialties: ['Europe', 'development', 'Africa'] },
  { id: 'france24', name: 'France 24', type: 'broadcast', region: 'France', reliability: 0.83, bias: 'center', url: 'france24.com', specialties: ['Africa', 'Middle East', 'EU'] },

  // Think Tanks (analytical, high reliability)
  { id: 'icg', name: 'International Crisis Group', type: 'think-tank', region: 'Global', reliability: 0.92, bias: 'independent', url: 'crisisgroup.org', specialties: ['conflict analysis', 'policy recommendations', 'field research'] },
  { id: 'sipri', name: 'SIPRI', type: 'think-tank', region: 'Sweden', reliability: 0.93, bias: 'independent', url: 'sipri.org', specialties: ['arms transfers', 'military expenditure', 'security'] },
  { id: 'iiss', name: 'IISS', type: 'think-tank', region: 'UK', reliability: 0.90, bias: 'center', url: 'iiss.org', specialties: ['strategic analysis', 'military balance', 'geopolitics'] },
  { id: 'chatham', name: 'Chatham House', type: 'think-tank', region: 'UK', reliability: 0.90, bias: 'center', url: 'chathamhouse.org', specialties: ['international affairs', 'governance', 'regional analysis'] },
  { id: 'brookings', name: 'Brookings Institution', type: 'think-tank', region: 'US', reliability: 0.88, bias: 'center-left', url: 'brookings.edu', specialties: ['US foreign policy', 'governance', 'economics'] },
  { id: 'cfr', name: 'Council on Foreign Relations', type: 'think-tank', region: 'US', reliability: 0.88, bias: 'center', url: 'cfr.org', specialties: ['US foreign policy', 'conflict tracker', 'backgrounders'] },
  { id: 'carnegie', name: 'Carnegie Endowment', type: 'think-tank', region: 'US', reliability: 0.88, bias: 'center', url: 'carnegieendowment.org', specialties: ['democracy', 'conflict', 'Middle East'] },
  { id: 'ucdp', name: 'UCDP', type: 'think-tank', region: 'Europe', reliability: 0.93, bias: 'independent', url: 'ucdp.uu.se', specialties: ['conflict data', 'event tracking', 'visualization'] },

  // Government / Official
  { id: 'un-news', name: 'UN News', type: 'government', region: 'Global', reliability: 0.90, bias: 'center', url: 'news.un.org', specialties: ['UN proceedings', 'humanitarian', 'peacekeeping'] },
  { id: 'reliefweb', name: 'ReliefWeb', type: 'government', region: 'Global', reliability: 0.92, bias: 'independent', url: 'reliefweb.int', specialties: ['humanitarian', 'natural disasters', 'conflict response'] },
  { id: 'state-dept', name: 'US State Department', type: 'government', region: 'US', reliability: 0.85, bias: 'state-aligned', url: 'state.gov', specialties: ['US foreign policy', 'sanctions', 'human rights reports'] },
  { id: 'eeas', name: 'EU External Action Service', type: 'government', region: 'EU', reliability: 0.85, bias: 'state-aligned', url: 'eeas.europa.eu', specialties: ['EU foreign policy', 'sanctions', 'mediation'] },

  // Regional
  { id: 'middle-east-eye', name: 'Middle East Eye', type: 'regional', region: 'Middle East', reliability: 0.75, bias: 'center-left', url: 'middleeasteye.net', specialties: ['Middle East', 'North Africa'] },
  { id: 'the-africa-report', name: 'The Africa Report', type: 'regional', region: 'Africa', reliability: 0.78, bias: 'center', url: 'theafricareport.com', specialties: ['Africa', 'politics', 'economics'] },
  { id: 'nikkei', name: 'Nikkei Asia', type: 'regional', region: 'Asia', reliability: 0.85, bias: 'center', url: 'asia.nikkei.com', specialties: ['East Asia', 'trade', 'geopolitics'] },

  // Investigative
  { id: 'bellingcat', name: 'Bellingcat', type: 'investigative', region: 'Global', reliability: 0.88, bias: 'independent', url: 'bellingcat.com', specialties: ['OSINT', 'verification', 'accountability'] },
  { id: 'occrp', name: 'OCCRP', type: 'investigative', region: 'Global', reliability: 0.88, bias: 'independent', url: 'occrp.org', specialties: ['corruption', 'organized crime', 'sanctions evasion'] },

  // State Media (use with caution)
  { id: 'xinhua', name: 'Xinhua', type: 'state-media', region: 'China', reliability: 0.55, bias: 'state-aligned', url: 'xinhuanet.com', specialties: ['China policy', 'BRI', 'Asia'], notes: 'State-controlled. Useful for understanding PRC official position, not independent reporting.' },
  { id: 'tass', name: 'TASS', type: 'state-media', region: 'Russia', reliability: 0.50, bias: 'state-aligned', url: 'tass.com', specialties: ['Russia policy', 'CIS', 'military'], notes: 'State-controlled. Useful for understanding Russian official position only.' },
];

/**
 * Get reliability label from score
 */
export function getReliabilityLabel(score: number): string {
  if (score >= 0.9) return 'Very High';
  if (score >= 0.8) return 'High';
  if (score >= 0.7) return 'Medium';
  if (score >= 0.6) return 'Low';
  return 'Very Low';
}

/**
 * Get sources by type
 */
export function getSourcesByType(type: MediaSource['type']): MediaSource[] {
  return GLOBAL_MEDIA_SOURCES.filter((s) => s.type === type);
}

/**
 * Get sources relevant to a region
 */
export function getSourcesForRegion(region: string): MediaSource[] {
  const regionLower = region.toLowerCase();
  return GLOBAL_MEDIA_SOURCES.filter((s) =>
    s.region.toLowerCase() === 'global' ||
    s.region.toLowerCase().includes(regionLower) ||
    s.specialties.some((sp) => sp.toLowerCase().includes(regionLower))
  );
}

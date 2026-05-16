export interface TrustMetric {
  id: string;
  label: string;
  value: string;
  status: 'pass' | 'warn' | 'pending';
}

export interface TrustState {
  activeModel: string;
  modelCurrentAsOf: string;
  sourceDomains: Array<{ name: string; url: string; tier: string; liveEnabled: boolean }>;
  evaluation: TrustMetric[];
  privacy: string[];
  limits: string[];
}

export function buildTrustState(
  now = new Date('2026-05-03T00:00:00Z'),
  activeModel = 'Server-selected Pro model',
): TrustState {
  return {
    activeModel,
    modelCurrentAsOf: now.toISOString().slice(0, 10),
    sourceDomains: [
      { name: 'User uploads', url: 'users/{uid}/situations/{sid}/documents', tier: 'customer', liveEnabled: true },
      { name: 'Grounded Google Search', url: 'https://google.com/search', tier: 'grounded-search', liveEnabled: true },
      { name: 'GDELT', url: 'https://www.gdeltproject.org/', tier: 'open-data', liveEnabled: true },
      { name: 'UCDP', url: 'https://ucdp.uu.se/', tier: 'open-data', liveEnabled: true },
      { name: 'ReliefWeb', url: 'https://reliefweb.int/', tier: 'open-data', liveEnabled: true },
      { name: 'HDX', url: 'https://data.humdata.org/', tier: 'open-data', liveEnabled: true },
      { name: 'UN News', url: 'https://news.un.org/', tier: 'open-data', liveEnabled: true },
      { name: 'World Bank', url: 'https://data.worldbank.org/', tier: 'open-data', liveEnabled: true },
    ],
    evaluation: [
      { id: 'extraction_f1', label: 'Extraction F1', value: 'A10 pending', status: 'pending' },
      { id: 'edge_precision', label: 'Edge precision', value: 'A10 pending', status: 'pending' },
      { id: 'confidence_calibration', label: 'Calibration ECE', value: 'A10 pending', status: 'pending' },
      { id: 'recipe_path_accuracy', label: 'Recipe path accuracy', value: 'A10 pending', status: 'pending' },
      { id: 'provenance_validity', label: 'Provenance validity', value: 'A10 pending', status: 'pending' },
    ],
    privacy: [
      'Customer data is stored in the PRAXIS Firebase/Google Cloud boundary and encrypted at rest.',
      'User API keys are handled as secrets and should not be exposed to third-party providers without explicit user configuration.',
      'Canonical graph mutations require analyst approval through GraphOps.',
    ],
    limits: [
      'Does not train foundation models on customer data.',
      'Does not reproduce copyrighted articles in full.',
      'Does not imply classified access; PRAXIS works from user-attached sources and configured connectors.',
      'Does not silently mix cached fallback data into authenticated user state.',
    ],
  };
}

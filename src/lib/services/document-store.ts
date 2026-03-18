/**
 * Shared in-memory document store for the document ingestion pipeline.
 * Stores uploaded documents and their extracted entities.
 */

export interface DocumentRecord {
  id: string;
  title: string;
  fileType: string;
  size: number;
  text: string;
  status: 'uploaded' | 'processing' | 'extracted' | 'error';
  uploadedAt: string;
  entities?: any;
  entityCount: number;
}

const store = new Map<string, DocumentRecord>();

// ---------------------------------------------------------------------------
// Pre-populate with two demo documents using Nordalia Crisis narrative
// ---------------------------------------------------------------------------

store.set('doc-001', {
  id: 'doc-001',
  title: 'SG Report S/2026/100 - Situation in Nordalia',
  fileType: 'pdf',
  size: 245_000,
  text: `I have the honour to submit the present report on the situation in Nordalia, pursuant to Security Council resolution 2890 (2025). The reporting period covers developments from 1 December 2025 to 28 February 2026.

The Government of Nordalia, led by President Amara Osei following disputed March 2024 elections, controls the national military (Armed Forces of Nordalia, AFN), state revenue institutions, and the capital Nordalia City. It is accused by opposition parties and international observers of systematic electoral fraud, ballot-stuffing in northern constituencies, and weaponizing state security services against political opponents.

The Democratic Reform Movement (DRM), led by Commander Kwame Asante, fields approximately 8,000 fighters organized into three corps operating primarily in the Eastern Provinces, with command and logistics infrastructure along the Westmark border. The DRM controls significant territory through its administrative arm, the Eastern Provincial Authority (EPA).

The UN Mission in Nordalia (UNMN), led by SRSG Maria Santos, deploys approximately 12,000 uniformed peacekeepers from 18 troop-contributing countries. UNMN is mandated to protect civilians, monitor the ceasefire, support humanitarian access, and facilitate the political process.

The Republic of Karovia provides military equipment, logistics support, and intelligence cooperation to the AFN and has seconded military advisors to the government. Karovia is widely believed to be supplying ammunition and light weapons in potential violation of the UNSC arms embargo.

The Federal Republic of Westmark hosts approximately 340,000 Nordalian refugees and has imposed targeted sanctions on 23 senior government officials for electoral fraud and human rights violations. Westmark provides diplomatic recognition to DRM representatives.

The ceasefire agreement brokered in January 2026 has not held. UNMN documented 47 violations during the reporting period, the majority attributed to government forces operating in the Valkhora-Drakmere corridor. The humanitarian situation remains dire, with 2.1 million people displaced and critical shortages of food and medical supplies in the Eastern Provinces.`,
  status: 'extracted',
  uploadedAt: '2026-02-28T10:00:00Z',
  entities: {
    actors: [
      { id: 'actor-1', name: 'Government of Nordalia', actorType: 'state', description: 'Internationally recognized government led by President Amara Osei', confidence: 0.96 },
      { id: 'actor-2', name: 'Democratic Reform Movement (DRM)', actorType: 'armed_group', description: 'Armed opposition led by Commander Kwame Asante', confidence: 0.95 },
      { id: 'actor-3', name: 'UN Mission in Nordalia (UNMN)', actorType: 'international_org', description: 'UN peacekeeping mission led by SRSG Maria Santos', confidence: 0.94 },
      { id: 'actor-4', name: 'Republic of Karovia', actorType: 'state', description: 'Regional power and external patron of the government', confidence: 0.88 },
      { id: 'actor-5', name: 'Federal Republic of Westmark', actorType: 'state', description: 'External supporter of DRM political legitimacy', confidence: 0.87 },
    ],
    claims: [
      { id: 'claim-1', actorId: 'actor-1', title: 'Electoral legitimacy', description: 'Government claims victory with 61% of the vote in 2024 elections', claimType: 'political', status: 'contested', confidence: 0.9 },
      { id: 'claim-2', actorId: 'actor-2', title: 'Electoral fraud', description: 'DRM alleges systematic electoral fraud and ballot-stuffing', claimType: 'political', status: 'active', confidence: 0.88 },
    ],
    interests: [
      { id: 'interest-1', actorId: 'actor-4', title: 'Rare earth mineral access', description: 'Protecting preferential access to Nordalia rare earth deposits', interestType: 'economic', priority: 'high', confidence: 0.85 },
    ],
    constraints: [
      { id: 'constraint-1', actorId: 'actor-3', title: 'Troop ceiling limitations', description: 'UNMN faces troop ceiling constraints and contested freedom of movement', constraintType: 'operational', severity: 'high', confidence: 0.82 },
    ],
    leverage: [
      { id: 'leverage-1', actorId: 'actor-5', targetActorId: 'actor-1', title: 'Targeted sanctions', description: 'Westmark imposed sanctions on 23 senior government officials', leverageType: 'economic', confidence: 0.91 },
    ],
    commitments: [
      { id: 'commitment-1', actorId: 'actor-1', title: 'Ceasefire Agreement', description: 'Ceasefire agreement brokered in January 2026', commitmentType: 'ceasefire', status: 'violated', confidence: 0.93 },
    ],
    events: [
      { id: 'event-1', title: 'Ceasefire violations', description: '47 ceasefire violations documented by UNMN during reporting period', eventType: 'military', date: '2026-01-15', impact: 'high', confidence: 0.92 },
    ],
    narratives: [
      { id: 'narrative-1', actorId: 'actor-1', title: 'Democratic mandate', description: 'Government frames itself as democratically elected and defending sovereignty', narrativeType: 'legitimacy', confidence: 0.86 },
    ],
  },
  entityCount: 14,
});

store.set('doc-002', {
  id: 'doc-002',
  title: 'Ceasefire Agreement - Government and DRM',
  fileType: 'docx',
  size: 128_000,
  text: `The Government of the Republic of Nordalia and the Democratic Reform Movement, desiring to end hostilities and establish conditions for a durable peace, hereby agree to the following terms:

Article 1 - Cessation of Hostilities
Both parties shall immediately cease all offensive military operations, including ground operations, aerial bombardment, and cross-border attacks. The Armed Forces of Nordalia shall withdraw to positions west of the Valkhora River within 72 hours. DRM forces shall consolidate in designated cantonment areas within the Eastern Provinces.

Article 2 - Buffer Zone
A demilitarized buffer zone of 15 kilometers shall be established along the current line of contact, monitored by UNMN peacekeepers. Neither party shall deploy armed personnel, weapons systems, or military equipment within the buffer zone.

Article 3 - Humanitarian Access
Both parties shall guarantee immediate and unimpeded humanitarian access to all affected populations. The ICRC shall be permitted to conduct detainee visits in all facilities operated by both parties. Humanitarian corridors from Nordalia City to the Eastern Provinces shall be operational within 48 hours.

Article 4 - Political Process
Both parties commit to participating in AU-mediated political dialogue within 30 days of the ceasefire taking effect. The dialogue shall address electoral reform, transitional justice, and power-sharing arrangements. The Civil Society Coalition of Nordalia shall be granted observer status.

Article 5 - Monitoring and Verification
UNMN shall serve as the primary monitoring and verification mechanism. Both parties shall provide UNMN with full freedom of movement throughout Nordalia. Violations shall be reported to the UN Security Council through the SRSG.

Signed at Nordalia City on 15 January 2026.`,
  status: 'extracted',
  uploadedAt: '2026-02-25T14:30:00Z',
  entities: {
    actors: [
      { id: 'actor-1', name: 'Government of Nordalia', actorType: 'state', description: 'Party to the ceasefire agreement', confidence: 0.97 },
      { id: 'actor-2', name: 'Democratic Reform Movement (DRM)', actorType: 'armed_group', description: 'Party to the ceasefire agreement', confidence: 0.97 },
      { id: 'actor-3', name: 'UNMN', actorType: 'international_org', description: 'Primary monitoring mechanism for the ceasefire', confidence: 0.95 },
      { id: 'actor-4', name: 'ICRC', actorType: 'international_org', description: 'Permitted to conduct detainee visits', confidence: 0.88 },
      { id: 'actor-5', name: 'Civil Society Coalition of Nordalia', actorType: 'civil_society', description: 'Granted observer status in political dialogue', confidence: 0.85 },
    ],
    claims: [],
    interests: [],
    constraints: [
      { id: 'constraint-1', actorId: 'actor-1', title: 'Buffer zone restrictions', description: 'Neither party may deploy armed personnel within 15km buffer zone', constraintType: 'military', severity: 'high', confidence: 0.95 },
      { id: 'constraint-2', actorId: 'actor-1', title: 'AFN withdrawal requirement', description: 'AFN must withdraw west of Valkhora River within 72 hours', constraintType: 'military', severity: 'high', confidence: 0.93 },
    ],
    leverage: [],
    commitments: [
      { id: 'commitment-1', actorId: 'actor-1', title: 'Ceasefire terms', description: 'Cease all offensive military operations including ground operations and aerial bombardment', commitmentType: 'ceasefire', status: 'signed', confidence: 0.97 },
      { id: 'commitment-2', actorId: 'actor-1', title: 'Humanitarian access guarantee', description: 'Both parties guarantee immediate and unimpeded humanitarian access', commitmentType: 'humanitarian', status: 'signed', confidence: 0.95 },
      { id: 'commitment-3', actorId: 'actor-1', title: 'Political dialogue participation', description: 'Both parties commit to AU-mediated political dialogue within 30 days', commitmentType: 'political', status: 'signed', confidence: 0.94 },
      { id: 'commitment-4', actorId: 'actor-3', title: 'Ceasefire monitoring', description: 'UNMN serves as primary monitoring and verification mechanism', commitmentType: 'operational', status: 'active', confidence: 0.93 },
    ],
    events: [
      { id: 'event-1', title: 'Ceasefire agreement signed', description: 'Ceasefire agreement signed at Nordalia City', eventType: 'diplomatic', date: '2026-01-15', impact: 'high', confidence: 0.98 },
    ],
    narratives: [],
  },
  entityCount: 13,
});

// ---------------------------------------------------------------------------
// Store access functions
// ---------------------------------------------------------------------------

export function addDocument(doc: DocumentRecord): void {
  store.set(doc.id, doc);
}

export function getDocument(id: string): DocumentRecord | undefined {
  return store.get(id);
}

export function listDocuments(): DocumentRecord[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export function updateDocumentEntities(
  id: string,
  entities: any,
  entityCount: number
): boolean {
  const doc = store.get(id);
  if (!doc) return false;
  doc.entities = entities;
  doc.entityCount = entityCount;
  doc.status = 'extracted';
  store.set(id, doc);
  return true;
}

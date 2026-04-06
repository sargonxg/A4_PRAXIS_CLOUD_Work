import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaseOntology } from '@/lib/constants/case-registry';

// ============================================================================
// Simplified types for the store
// ============================================================================

export interface ConflictSummary {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'frozen' | 'resolved' | 'emerging' | 'escalating';
  description: string;
  riskScore: number; // 1-10
  actorCount: number;
  graphEntities: number;
  events: { title: string; date: string }[];
}

export interface SavedScenario {
  id: string;
  conflictId: string;
  title: string;
  description: string;
  createdAt: string;
  outcome: string;
  probability: number;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'final';
}

export interface Report {
  id: string;
  title: string;
  conflictId: string;
  status: 'draft' | 'in_review' | 'approved' | 'published';
  createdAt: string;
  sections: ReportSection[];
}

export interface ConflictAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  conflictId: string;
  acknowledgedAt: string | null;
}

// ============================================================================
// Store interface
// ============================================================================

interface ConflictStore {
  // Conflicts list
  conflicts: ConflictSummary[];
  addConflict: (conflict: ConflictSummary) => void;
  removeConflict: (id: string) => void;
  updateConflict: (id: string, updates: Partial<ConflictSummary>) => void;

  // Active conflict
  activeConflictId: string;
  setActiveConflict: (id: string) => void;
  getActiveConflict: () => ConflictSummary | undefined;

  // Active case ontology (loaded from API)
  activeCaseOntology: CaseOntology | null;
  loadCase: (id: string) => void;

  // Async initialization — fetches ontology from API route
  initializeFromRegistry: () => Promise<void>;

  // Custom user-created cases (ontologies only; summary added to conflicts[])
  customCases: Record<string, CaseOntology>;
  addCustomCase: (id: string, ontology: CaseOntology) => void;
  removeCustomCase: (id: string) => void;

  // Session tracking
  sessionStartedAt: string;
  aiQueryCount: number;
  incrementQueryCount: () => void;
  resetSession: () => void;

  // Saved scenarios
  savedScenarios: SavedScenario[];
  addScenario: (scenario: SavedScenario) => void;
  removeScenario: (id: string) => void;

  // Reports
  reports: Report[];
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  removeReport: (id: string) => void;

  // Alerts
  alerts: ConflictAlert[];
  addAlert: (alert: ConflictAlert) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;

  // Visited pages tracking
  visitedPages: string[];
  markPageVisited: (page: string) => void;

  // Auto-brief setting
  autoBriefEnabled: boolean;
  setAutoBrief: (enabled: boolean) => void;

  // New: Sync from Situation
  syncFromSituation: (situation: any) => void;
}

// ============================================================================
// Module-level ontology cache (avoids re-fetching on every loadCase call)
// ============================================================================

const ontologyCache = new Map<string, CaseOntology>();
const ontologyInflight = new Map<string, Promise<CaseOntology | null>>();

async function fetchOntology(id: string): Promise<CaseOntology | null> {
  const cached = ontologyCache.get(id);
  if (cached) return cached;

  // Deduplicate concurrent requests for the same ID
  if (!ontologyInflight.has(id)) {
    const promise = fetch(`/api/data/conflicts?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        const ontology: CaseOntology | null = data?.ontology ?? null;
        if (ontology) ontologyCache.set(id, ontology);
        ontologyInflight.delete(id);
        return ontology;
      })
      .catch(() => {
        ontologyInflight.delete(id);
        return null;
      });
    ontologyInflight.set(id, promise);
  }

  return ontologyInflight.get(id)!;
}

// ============================================================================
// Seed data — generated from CASE_REGISTRY
// ============================================================================

const SEED_CONFLICTS: ConflictSummary[] = [
  {
    id: 'nordalia-crisis',
    name: 'The Nordalia Crisis',
    region: 'Nordalia (fictional)',
    status: 'active',
    description:
      'A multi-party political crisis triggered by disputed general elections in June 2025, resulting in armed confrontation, international mediation, and an ongoing peace process.',
    riskScore: 7.8,
    actorCount: 12,
    graphEntities: 47,
    events: [
      { title: 'DRM offensive resumed near Kessara', date: '2026-03-10' },
      { title: 'ICRC access negotiations stalled', date: '2026-03-08' },
      { title: 'Karovia resupply convoy detected at border', date: '2026-03-06' },
      { title: 'UNMIN monitoring report published', date: '2026-03-04' },
      { title: 'Emergency ceasefire consultations in Geneva', date: '2026-03-01' },
    ],
  },
  {
    id: 'sahel-corridor',
    name: 'Sahel Corridor Instability',
    region: 'West Africa / Sahel',
    status: 'active',
    description:
      'Ongoing multi-state fragility across the Sahel corridor, with armed group proliferation, cross-border arms flows, and weakened state authority following successive coups.',
    riskScore: 6.2,
    actorCount: 18,
    graphEntities: 63,
    events: [
      { title: 'New arms route identified via southern Sertania', date: '2026-03-09' },
      { title: 'AU PSC emergency session convened', date: '2026-03-07' },
      { title: 'ECOWAS mediation group meeting — Niger', date: '2026-03-05' },
      { title: 'Cross-border incident near Mali-Burkina boundary', date: '2026-03-02' },
      { title: 'Panel of Experts interim report submitted', date: '2026-02-27' },
    ],
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea Tensions',
    region: 'Indo-Pacific',
    status: 'active',
    description:
      'Escalating maritime territorial disputes in the South China Sea, with increased naval presence, incidents at contested features, and strained diplomatic channels.',
    riskScore: 5.1,
    actorCount: 7,
    graphEntities: 34,
    events: [
      { title: 'Naval standoff at contested shoal', date: '2026-03-11' },
      { title: 'ASEAN ministerial statement issued', date: '2026-03-08' },
      { title: 'US Freedom of Navigation Operation conducted', date: '2026-03-05' },
      { title: 'Philippines lodges diplomatic protest', date: '2026-03-02' },
      { title: 'China coast guard intercepts supply vessel', date: '2026-02-28' },
    ],
  },
  {
    id: 'techcorp-restructuring',
    name: 'TechCorp Engineering Restructuring Dispute',
    region: 'United States (Pacific Northwest)',
    status: 'active',
    description:
      'Multi-party organizational labor dispute involving layoff discrimination claims, nascent unionization, and federal mediation. Enterprise use case demonstration.',
    riskScore: 4.2,
    actorCount: 8,
    graphEntities: 28,
    events: [
      { title: 'First FMCS mediation session: positions exchanged', date: '2026-01-15' },
      { title: 'NLRB representation hearing: bargaining unit narrowed', date: '2026-02-12' },
      { title: 'Second FMCS session: tentative framework on discrimination claims', date: '2026-02-26' },
      { title: 'TEU demands reinstatement as non-negotiable precondition', date: '2026-03-05' },
    ],
  },
  {
    id: 'ethiopia-tigray',
    name: 'Ethiopia-Tigray: Post-Pretoria Peace Process',
    region: 'Horn of Africa',
    status: 'active',
    description:
      'Implementation of the 2022 Cessation of Hostilities Agreement — DDR, humanitarian access, Western Tigray status, and accountability — based on publicly available open-source reporting.',
    riskScore: 6.8,
    actorCount: 9,
    graphEntities: 38,
    events: [
      { title: 'AU Panel: DDR at 18%, Western Tigray stalled', date: '2026-01-08' },
      { title: 'Domestic transitional justice task force convenes', date: '2025-10-14' },
      { title: 'Tigray CSO forum calls for international tribunal', date: '2026-03-04' },
    ],
  },
  {
    id: 'riverside-land-dispute',
    name: 'Riverside County: Development vs. Indigenous Land Rights',
    region: 'Pacific Northwest (fictional)',
    status: 'active',
    description:
      'Multi-stakeholder local dispute involving indigenous treaty rights, environmental protection, and county development approval — community/NGO use case demonstration.',
    riskScore: 3.8,
    actorCount: 7,
    graphEntities: 22,
    events: [
      { title: 'All parties enter federal mediation; court defers ruling', date: '2026-02-01' },
      { title: 'First mediation session: cultural site visit proposed', date: '2026-03-10' },
    ],
  },
];

const SEED_ALERTS: ConflictAlert[] = [
  {
    id: 'alert-001',
    severity: 'high',
    title: 'DRM offensive advancing toward Kessara — ceasefire at risk',
    description:
      'Reports indicate that Democratic Reform Movement forces have resumed offensive operations in the direction of Kessara. The September 2025 ceasefire agreement may be in jeopardy. UNMIN monitoring teams have been unable to verify frontline positions in the past 24 hours.',
    conflictId: 'nordalia-crisis',
    acknowledgedAt: null,
  },
  {
    id: 'alert-002',
    severity: 'medium',
    title: 'ICRC access negotiations stalled — 72-hour window closing',
    description:
      'International Committee of the Red Cross negotiations for humanitarian access to the northern Kessara corridor have stalled. A previously agreed 72-hour access window is set to expire without a renewal agreement in place. Approximately 14,000 civilians may be affected.',
    conflictId: 'nordalia-crisis',
    acknowledgedAt: null,
  },
  {
    id: 'alert-003',
    severity: 'low',
    title: 'UNMN mandate renewal due in 47 days — member state consultations needed',
    description:
      'The UNSC mandate for the United Nations Mission in Nordalia (UNMIN) is due for renewal in 47 days. Preliminary soundings suggest two P5 members may seek modifications to the mandate scope. Consultations with troop-contributing countries should be initiated.',
    conflictId: 'nordalia-crisis',
    acknowledgedAt: null,
  },
  {
    id: 'alert-004',
    severity: 'medium',
    title: 'Karovia military resupply convoy detected at northern border',
    description:
      "Satellite imagery analysis and ground-level reporting indicate a Karovian military resupply convoy has been observed at the northern border crossing point. The convoy's final destination and recipient are unconfirmed. This may constitute a violation of the arms embargo established under UNSC Resolution 2890.",
    conflictId: 'nordalia-crisis',
    acknowledgedAt: null,
  },
  {
    id: 'alert-005',
    severity: 'medium',
    title: 'Ethiopia-Tigray: Tigray CSO forum demands international tribunal',
    description:
      'A major Tigrayan civil society forum in Mekelle has issued a declaration calling for an international criminal tribunal for Ethiopia-Tigray conflict crimes, signed by 89 civil society organizations. This may complicate the ongoing domestic transitional justice process and create pressure on Western donor governments.',
    conflictId: 'ethiopia-tigray',
    acknowledgedAt: null,
  },
];

// ============================================================================
// Store
// ============================================================================

export const useConflictStore = create<ConflictStore>()(
  persist(
    (set, get) => ({
      // Conflicts
      conflicts: SEED_CONFLICTS,
      addConflict: (conflict) =>
        set((state) => ({
          conflicts: [...state.conflicts.filter((c) => c.id !== conflict.id), conflict],
        })),
      removeConflict: (id) =>
        set((state) => ({
          conflicts: state.conflicts.filter((c) => c.id !== id),
        })),
      updateConflict: (id, updates) =>
        set((state) => ({
          conflicts: state.conflicts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // Active conflict — default to Nordalia
      activeConflictId: 'nordalia-crisis',
      setActiveConflict: (id) => {
        set({ activeConflictId: id });
        // Auto-load the ontology when switching cases
        get().loadCase(id);
      },
      getActiveConflict: () => {
        const state = get();
        return state.conflicts.find((c) => c.id === state.activeConflictId);
      },

      // Active case ontology — starts null, populated via initializeFromRegistry or loadCase
      activeCaseOntology: null,
      loadCase: (id: string) => {
        // Check custom cases first (synchronous)
        const customOntology = get().customCases[id];
        if (customOntology) {
          set({ activeCaseOntology: customOntology });
          return;
        }

        // Check in-memory cache (synchronous)
        const cached = ontologyCache.get(id);
        if (cached) {
          set({ activeCaseOntology: cached });
          return;
        }

        // Fetch from API (async, fire-and-forget from the sync interface)
        fetchOntology(id).then((ontology) => {
          if (ontology && get().activeConflictId === id) {
            set({ activeCaseOntology: ontology });
          }
        });
      },

      // Async initialization — call this once on app mount to load default ontology
      initializeFromRegistry: async () => {
        const id = get().activeConflictId;

        // Check custom cases first
        const customOntology = get().customCases[id];
        if (customOntology) {
          set({ activeCaseOntology: customOntology });
          return;
        }

        const ontology = await fetchOntology(id);
        if (ontology && get().activeConflictId === id) {
          set({ activeCaseOntology: ontology });
        }
      },

      // Custom cases
      customCases: {},
      addCustomCase: (id: string, ontology: CaseOntology) =>
        set((state) => ({
          customCases: { ...state.customCases, [id]: ontology },
        })),
      removeCustomCase: (id: string) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.customCases;
          return { customCases: rest };
        }),

      // Session tracking
      sessionStartedAt: new Date().toISOString(),
      aiQueryCount: 0,
      incrementQueryCount: () =>
        set((state) => ({ aiQueryCount: state.aiQueryCount + 1 })),
      resetSession: () =>
        set({ sessionStartedAt: new Date().toISOString(), aiQueryCount: 0 }),

      // Saved scenarios
      savedScenarios: [],
      addScenario: (scenario) =>
        set((state) => ({ savedScenarios: [...state.savedScenarios, scenario] })),
      removeScenario: (id) =>
        set((state) => ({
          savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
        })),

      // Reports
      reports: [],
      addReport: (report) =>
        set((state) => ({ reports: [...state.reports, report] })),
      updateReport: (id, updates) =>
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      removeReport: (id) =>
        set((state) => ({ reports: state.reports.filter((r) => r.id !== id) })),

      // Alerts
      alerts: SEED_ALERTS,
      addAlert: (alert) =>
        set((state) => ({ alerts: [...state.alerts, alert] })),
      acknowledgeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a
          ),
        })),
      dismissAlert: (id) =>
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

      // Visited pages
      visitedPages: [],
      markPageVisited: (page) =>
        set((state) => ({
          visitedPages: state.visitedPages.includes(page)
            ? state.visitedPages
            : [...state.visitedPages, page],
        })),

      // Auto-brief — enabled by default so dashboard is populated on first load
      autoBriefEnabled: true,
      setAutoBrief: (enabled) => set({ autoBriefEnabled: enabled }),

      syncFromSituation: (situation) => {
        if (!situation) return;

        // 1. Update the conflict summary for the dashboard list
        const summary: ConflictSummary = {
          id: situation.id,
          name: situation.name,
          region: situation.region || 'Unknown',
          status: situation.status || 'active',
          description: situation.description || '',
          riskScore: situation.ontology?.riskScore || 5.0,
          actorCount: situation.ontology?.actors?.length || 0,
          graphEntities: (
            (situation.ontology?.actors?.length || 0) +
            (situation.ontology?.claims?.length || 0) +
            (situation.ontology?.events?.length || 0)
          ),
          events: situation.ontology?.events?.map((e: any) => ({
            title: e.description || e.name || 'Event',
            date: e.date || new Date().toISOString()
          })) || []
        };

        set((state) => ({
          activeConflictId: situation.id,
          activeCaseOntology: situation.ontology || null,
          conflicts: [
            summary,
            ...state.conflicts.filter((c) => c.id !== situation.id)
          ]
        }));
      },
    }),
    {
      name: 'praxis-conflict-store',
      version: 3,
    }
  )
);

// ============================================================================
// Convenience selector hooks
// ============================================================================

/** Get the active case ontology directly */
export function useActiveCaseOntology() {
  return useConflictStore((s) => s.activeCaseOntology);
}

/** Get unacknowledged alerts for the active conflict */
export function useActiveAlerts() {
  return useConflictStore((s) =>
    s.alerts.filter(
      (a) => a.conflictId === s.activeConflictId && a.acknowledgedAt === null
    )
  );
}

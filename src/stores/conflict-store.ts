import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

// ============================================================================
// Seed data
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
      'Satellite imagery analysis and ground-level reporting indicate a Karovian military resupply convoy has been observed at the northern border crossing point. The convoy\'s final destination and recipient are unconfirmed. This may constitute a violation of the arms embargo established under UNSC Resolution 2890.',
    conflictId: 'nordalia-crisis',
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
      setActiveConflict: (id) => set({ activeConflictId: id }),
      getActiveConflict: () => {
        const state = get();
        return state.conflicts.find((c) => c.id === state.activeConflictId);
      },

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

      // Auto-brief
      autoBriefEnabled: false,
      setAutoBrief: (enabled) => set({ autoBriefEnabled: enabled }),
    }),
    {
      name: 'praxis-conflict-store',
      version: 2,
    }
  )
);

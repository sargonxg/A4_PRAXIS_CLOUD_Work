import {
  APP_BUILD_DATE,
  APP_BUILD_LABEL,
  APP_BUILD_NUMBER,
  APP_RELEASE_LABEL,
  APP_VERSION,
} from '@/lib/constants/app-version';

export interface PraxisReleaseNote {
  buildNumber: string;
  version: string;
  date: string;
  title: string;
  summary: string;
  category: 'product' | 'runtime' | 'documentation' | 'governance';
  items: string[];
}

export const CURRENT_PRAXIS_RELEASE = {
  version: APP_VERSION,
  buildDate: APP_BUILD_DATE,
  buildNumber: APP_BUILD_NUMBER,
  releaseLabel: APP_RELEASE_LABEL,
  buildLabel: APP_BUILD_LABEL,
} as const;

export const PRAXIS_RELEASE_NOTES: PraxisReleaseNote[] = [
  {
    buildNumber: '2026.05.16.09',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Capsule manager becomes the app surface',
    summary: 'PRAXIS now treats the capsule library as the only substantive app page beside public pricing and release notes.',
    category: 'product',
    items: [
      'The signed-in cockpit now loads real user capsules, supports capsule search and category filters, and shows stored ids, versions, sources, documents, tools, and outputs.',
      'Capsule cards can select, ask, improve, categorize, refresh, upload into, or archive capsules without leaving /app.',
      'Public navigation is reduced to Home, Capsules, Pricing, and Release notes; /learn and /tacitus redirect back to Home.',
      'The app sidebar and command palette now point users back to the capsule manager instead of separate Memo, Canvas, Library, Ask, or Advanced pages.',
    ],
  },
  {
    buildNumber: '2026.05.16.08',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'One-page PRAXIS app consolidation',
    summary: 'PRAXIS now enters one authenticated app surface at /app while Learn, Pricing, Release notes, and TACITUS remain the only public navigation links.',
    category: 'product',
    items: [
      'Collapsed the authenticated dashboard, assistant, context, canvas, writing, tools, situations, profile, and settings pages into the single /app cockpit.',
      'Kept compatibility redirects for old app URLs so shared links land on the one-page PRAXIS workspace.',
      'Added public Pricing and Release notes pages beside Learn, with TACITUS routed to tacitus.me.',
      'Document uploads now carry the active ContextCapsule id from the cockpit so the library intake binds files to the selected capsule.',
    ],
  },
  {
    buildNumber: '2026.05.16.07',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Route cleanup and cockpit smoke alignment',
    summary: 'The public surface is narrower: legacy demo pages and old tour UI are removed while compatibility redirects stay in proxy.',
    category: 'governance',
    items: [
      'Removed the retired demo route surface so users enter PRAXIS through authenticated, user-owned workspaces.',
      'Deleted the unused guided-tour component stack and its stale unit test.',
      'Replaced the dashboard command-center smoke with checks for the shared Tasklet-style PRAXIS capsule cockpit.',
      'The demo fixture verifier now validates seed data only, not a public demo route implementation.',
    ],
  },
  {
    buildNumber: '2026.05.16.06',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Gemini 3.1 Pro cockpit option',
    summary: 'The model selector now tracks the current Google Cloud Gemini 3 guidance for deep policy reasoning while preserving Gemini 2.5 fallbacks.',
    category: 'runtime',
    items: [
      'Deep memo and long-context routes now default to Gemini 3.1 Pro Preview in the central model matrix.',
      'The cockpit exposes Gemini 3.1 Pro Preview, Gemini 3 Flash Preview, and Gemini 2.5 fallback choices.',
      'The runtime catalog test now guards the expanded frontier model selector.',
    ],
  },
  {
    buildNumber: '2026.05.16.05',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Inline capsule-aware PRAXIS discussion',
    summary: 'The shared cockpit bar can now discuss directly from the selected ContextCapsule stack instead of depending on the floating assistant shell.',
    category: 'runtime',
    items: [
      'Chat with PRAXIS now calls the Ask PRAXIS endpoint directly from the cockpit when signed in.',
      'Each run sends the concatenated capsule stack, selected tools, output template, user lens, and selected Gemini model as context.',
      'The cockpit renders an inline discussion panel so the dashboard remains visually aligned with the public Home while gaining signed-in functionality.',
      'Public Home keeps the same surface and routes attempted runs through login handoff.',
    ],
  },
  {
    buildNumber: '2026.05.16.04',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Capsule library mechanics and Gemini model choices',
    summary: 'The Ask cockpit now treats Context Capsules as a real editable stack and exposes the current Gemini 3 plus stable Gemini 2.5 Vertex choices.',
    category: 'product',
    items: [
      'Capsules in the rail above the Ask bar can now be changed, removed, searched, or replaced from the capsule library.',
      'The same popup includes a tool and core library so policy tools can be toggled without leaving the discussion surface.',
      'The composer supports Enter to send, Shift+Enter for a new line, and Shift+Up to restore the last queued message for editing.',
      'The model selector now includes Gemini 3 Flash/Pro Preview and Gemini 2.5 Pro/Flash/Flash-Lite Vertex options.',
    ],
  },
  {
    buildNumber: '2026.05.16.03',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Dashboard and context shell coherence',
    summary: 'The signed-in dashboard now matches the public cockpit more closely, with one visible capsule-concatenation control and a quieter context management page.',
    category: 'product',
    items: [
      'Removed the dashboard floating Ask launcher so the signed-in Home keeps the same bar-first cockpit as public Home.',
      'Moved capsule recipe actions into the single Context Capsule concatenation rail above the Ask bar.',
      'Removed duplicate capsule composition UI from Context management; that page now focuses on context health, portable .core packages, sharing posture, and governance.',
      'Updated cockpit audits to guard the single concatenation affordance.',
    ],
  },
  {
    buildNumber: '2026.05.16.02',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'Cockpit polish and Learn hub',
    summary: 'The public and signed-in cockpit now stay visually aligned, while Learn carries the deeper product explanation.',
    category: 'product',
    items: [
      'Public Home and signed-in Home share the same capsule cockpit surface.',
      'Internal provider/runtime/token labels were removed from the main cockpit.',
      'The cockpit uses a quieter policy-grid background, rounder surfaces, and clearer Context Capsule language.',
      '/learn now has a sidebar with sections for capsule cores, ten policy paths, tools, outputs, connectors, and planned scaffolding.',
    ],
  },
  {
    buildNumber: '2026.05.16.01',
    version: '6.4.1',
    date: '2026-05-16',
    title: 'First OutputCapsule registry slice',
    summary: 'PRAXIS now has a typed output-product catalog behind the same simple cockpit.',
    category: 'runtime',
    items: [
      'Added schema-versioned OutputCapsule templates for daily reads, country packs, media, risk, humanitarian, diplomatic, memo, and talking-point outputs.',
      'Added deterministic planning, quality blockers, hidden-tool mappings, and country-pack composition.',
      'The cockpit shows a compact Produce selector with missing cores and suggested producer steps.',
      'Persistence from live agent/tool runs remains the next runtime wave.',
    ],
  },
  {
    buildNumber: '2026.05.15.04',
    version: '6.4.0',
    date: '2026-05-15',
    title: 'Context Capsule cockpit and portable cores',
    summary: 'The PRAXIS cockpit became capsule-first, with core health and portable package support.',
    category: 'product',
    items: [
      'Public and authenticated Home use the same Tasklet-style PRAXIS cockpit.',
      'Context Capsule management gained trust/health posture, .core export/import, clone/share/download foundations, and community metadata.',
      'Ask PRAXIS can preserve capsule conversation context and attach document/source intent.',
      'The visible app stays simple while advanced capsule management remains in the context surfaces.',
    ],
  },
  {
    buildNumber: '2026.05.15.03',
    version: '6.4.0',
    date: '2026-05-15',
    title: 'Research Memo Agent and policy workbench',
    summary: 'Policy agents moved behind a compact cockpit instead of a default marketplace grid.',
    category: 'runtime',
    items: [
      'Introduced the policy-agent registry for research memo, sourceability review, red-team review, daily brief, and handover modes.',
      'Research Memo Agent creates a Memo Studio draft with source and gap receipts through the worker boundary.',
      'Policy agents stay recommended or drawer-based instead of overwhelming the default surface.',
      'Run destinations are explicit: Memo Studio, Canvas, Library, and Handover.',
    ],
  },
  {
    buildNumber: '2026.05.15.02',
    version: '6.4.0',
    date: '2026-05-15',
    title: 'Genkit sourceability and path classifier',
    summary: 'Typed Genkit flows became available as safe capsule-aware checks.',
    category: 'runtime',
    items: [
      'Added Sourceability Check for supported, weak, unsupported, and date-sensitive claims against provided snippets.',
      'Added Context Capsule path classification against the canonical policy path registry.',
      'Fallback behavior remains deterministic when provider execution is unavailable.',
      'The routes classify and review only; they do not mutate capsules, send externally, or claim broader automation.',
    ],
  },
  {
    buildNumber: '2026.05.15.01',
    version: '6.4.0',
    date: '2026-05-15',
    title: 'Public pages and cleanup guardrails',
    summary: 'The public surface was narrowed around Learn, TACITUS, Release notes, and the capsule cockpit.',
    category: 'documentation',
    items: [
      'Added public Learn, TACITUS, and Release notes surfaces.',
      '/tour redirects back to Home.',
      'Tasklet MVP and public-surface audits guard the simplified public entry.',
      'Historical build prompt packs moved under docs/_archive/build with active pointer stubs preserved.',
    ],
  },
];

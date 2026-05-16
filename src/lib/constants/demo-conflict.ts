export const DEMO_CONFLICT = {
  id: 'nordalia-crisis',
  name: 'Nordalia Crisis',
  description: 'Compact conflict fixture retained for compatibility tests and tool fallbacks.',
  actors: [
    { id: 'actor-government', name: 'Government of Nordalia', type: 'state', description: 'Incumbent authorities managing a disputed transition.' },
    { id: 'actor-opposition', name: 'Democratic Reform Movement', type: 'opposition', description: 'Opposition coalition contesting the political settlement.' },
    { id: 'actor-un', name: 'UN Mission', type: 'international', description: 'International mission supporting mediation and monitoring.' },
  ],
  events: [
    { id: 'event-election', title: 'Disputed election', date: '2026-01-15', description: 'Election results triggered competing claims and protests.' },
    { id: 'event-talks', title: 'Mediation talks', date: '2026-02-10', description: 'External mediators convened parties for de-escalation talks.' },
  ],
  narratives: [
    { id: 'narrative-legitimacy', title: 'Legitimacy dispute', description: 'Parties contest mandate, process, and institutional control.' },
  ],
};

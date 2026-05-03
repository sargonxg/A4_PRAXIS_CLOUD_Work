import type { RecipeId } from '@/lib/dialectica/client';

export interface SyriaCachedRecipe {
  recipe: RecipeId;
  code: string;
  params: Record<string, unknown>;
  confidence: number;
  title: string;
  question: string;
  result: string;
  provenance: string[];
}

export const SYRIA_CACHED_RECIPE_RESULTS: SyriaCachedRecipe[] = [
  {
    recipe: 'leverage-trace',
    code: 'LEVERAGE-TRACE',
    params: { actor_a_id: 'actor-syrian-government', actor_b_id: 'actor-sdf' },
    confidence: 0.74,
    title: 'Find the real leverage path',
    question: 'What leverage does Damascus hold over the SDF, and vice versa?',
    result: 'Damascus has revenue, recognition, currency, and integration-timeline leverage; the SDF has territorial control, detention/counter-ISIL utility, and Western relationship leverage.',
    provenance: ['UN transition reporting', 'Northeast Syria local-source packet', 'GDELT/ReliefWeb Syria source layer'],
  },
  {
    recipe: 'commitment-check',
    code: 'COMMITMENT-CHECK',
    params: { situation_id: 'syria-transition-2026', time_window: '60d' },
    confidence: 0.71,
    title: 'Turn agreements into compliance tests',
    question: 'Which provisions of the 30 January integration agreement are at risk?',
    result: 'Rights guarantees, command integration timelines, revenue-sharing, and humanitarian-access assurances are fragile because implementation evidence is thin and source streams diverge.',
    provenance: ['UN Geneva/Special Envoy baseline', 'ReliefWeb/OCHA humanitarian layer', 'Graph hypotheses staged from source documents'],
  },
  {
    recipe: 'interest-vs-position',
    code: 'INTEREST-vs-POSITION',
    params: { actor_ids: ['actor-syrian-government', 'actor-sdf'] },
    confidence: 0.69,
    title: 'Separate stated claims from durable interests',
    question: "Where do Damascus's stated positions diverge from likely interests?",
    result: 'The negotiable opening is not autonomy language itself; it is sequencing security integration while preserving counter-ISIL continuity, revenue predictability, and international legitimacy.',
    provenance: ['Actor-interest subgraph', 'Local independent reporting', 'DIALECTICA semantic view'],
  },
  {
    recipe: 'counter-narrative',
    code: 'COUNTER-NARRATIVE',
    params: { event_id: 'event-southern-syria-flashpoint' },
    confidence: 0.66,
    title: 'Compare official, local, and humanitarian frames',
    question: 'How do Damascus, SDF, and Israel narrate southern Syria flashpoints?',
    result: 'The graph separates sovereignty-restoration, civilian-protection, and local-security narratives, then shows citation divergence so a diplomat can draft without adopting any party frame.',
    provenance: ['Stance view', 'Media Compass source tiers', 'Citation-divergence scoring'],
  },
  {
    recipe: 'path-search',
    code: 'PATH-SEARCH',
    params: { situation_id: 'syria-transition-2026', goal_state: 'preserve the integration agreement for 60 days' },
    confidence: 0.7,
    title: 'Search only the missing graph edges',
    question: 'What sequence of UN actions has the highest probability of preserving the agreement?',
    result: 'Ranked path: technical verification mission, quiet Damascus-SDF diplomacy, Security Council reporting cadence, and contingent humanitarian access guarantees.',
    provenance: ['Episodic + Semantic graph union', 'Constraint compatibility rule', 'Source-grounded intervention chain'],
  },
];

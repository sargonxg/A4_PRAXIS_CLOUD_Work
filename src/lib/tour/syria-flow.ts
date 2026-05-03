import type { TourChapter } from './chapter-flow';

export const SYRIA_TOUR_FLOW: TourChapter[] = [
  {
    id: 'situation-frame',
    title: 'Situation Frame',
    estimateSeconds: 75,
    target: { selector: '#situation-frame', offsetTop: 80 },
    narration: { text: 'Frame the Syria transition, core actors, risk, escalation stage, and source coverage before reasoning.' },
  },
  {
    id: 'source-receipts',
    title: 'Source Receipts',
    estimateSeconds: 75,
    target: { selector: '#source-receipts', offsetTop: 80 },
    narration: { text: 'Show reliability tiers, retrieval timestamps, and exact-source provenance for every claim.' },
  },
  {
    id: 'conflict-graph',
    title: 'Conflict Graph',
    estimateSeconds: 105,
    target: { selector: '#conflict-graph', offsetTop: 80 },
    narration: { text: 'Switch between Episodic, Semantic, and Stance views; toggle counterfactuals to mark graph deltas.' },
  },
  {
    id: 'dialectica-reasoning',
    title: 'DIALECTICA Reasoning',
    estimateSeconds: 210,
    target: { selector: '#dialectica-reasoning', offsetTop: 80 },
    narration: { text: 'Run the five deterministic recipes and inspect confidence, provenance, and cached fallback behavior.' },
  },
  {
    id: 'decision-product',
    title: 'Decision Product',
    estimateSeconds: 105,
    target: { selector: '#decision-product', offsetTop: 80 },
    narration: { text: 'Close with briefing, policy memo, talking points, and pattern analogs that preserve source defensibility.' },
  },
];

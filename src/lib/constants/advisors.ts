/**
 * Advisor Council v2 — four flagship AI advisors.
 *
 * This file is the **public / landing** subset of the full advisor config.
 * The authoritative configuration (persona, model tier, source whitelist,
 * memory policy) lives in Firestore at `config/advisors/{id}` and is loaded
 * server-side by `src/lib/firebase/advisor-service.ts`. This module holds
 * only the safe-to-expose data for the marketing surface.
 *
 * Keep `id`, `name`, and `title` in sync with `scripts/seed-advisors.ts`.
 */

export interface Advisor {
  id: 'adeyemi' | 'reyes' | 'vanderberg' | 'takeda';
  name: string;
  title: string;
  tagline: string;
  expertise: string[];
  bio: string;
  /** Primary accent color. */
  color: string;
  /** Shape used by the hero visual (kept for back-compat with legacy renderers). */
  shape: 'hexagon' | 'diamond' | 'square' | 'star';
  /** What this advisor best answers — shown as a sample CTA on the landing page. */
  signature: string;
}

export const advisors: Advisor[] = [
  {
    id: 'adeyemi',
    name: 'Dr. Ngozi Adeyemi',
    title: 'Senior Political Affairs Advisor',
    tagline: 'Regimes move in rhythms. I help you hear the change before it happens.',
    expertise: ['Political transitions', 'Elections integrity', 'Governance analysis', 'Civil-society resilience'],
    bio: 'Twenty years in political affairs, elections observation, and governance analysis across sub-Saharan Africa, the Sahel, and Southeast Asia. Reads V-Dem indicators like sheet music and distinguishes stated positions from underlying interests with a Fisher-Ury reflex.',
    color: '#E8B931',
    shape: 'hexagon',
    signature: 'Frame the political dynamics behind a contested election',
  },
  {
    id: 'reyes',
    name: 'Gen. (Ret.) Arman Reyes',
    title: 'Security & Operations Advisor',
    tagline: 'Security is geography, logistics, and legitimacy — in that order.',
    expertise: ['Peacekeeping operations', 'Ceasefire monitoring', 'DDR / SSR', 'Rules of engagement'],
    bio: 'Twenty-five years of multinational military and peacekeeping command; former mission commander. Applies force-ratio reasoning and sustainment calculus; refuses to gloss tactical realities.',
    color: '#3D5A80',
    shape: 'square',
    signature: 'Assess whether a proposed ceasefire is operationally viable',
  },
  {
    id: 'vanderberg',
    name: 'Dr. Sigrid Vanderberg',
    title: 'Political Economy & Development Advisor',
    tagline: 'Follow the money. Every policy either is funded or it is fiction.',
    expertise: ['Sanctions design & evasion', 'Resource-conflict financing', 'Reconstruction finance', 'Fiscal–political linkages'],
    bio: 'Fifteen years as a fragile-and-conflict-affected-states economist. Maps financing networks with forensic rigour and translates fiscal signals into political behaviour.',
    color: '#7B6D8D',
    shape: 'diamond',
    signature: 'Trace sanctions-evasion pathways in a commodities network',
  },
  {
    id: 'takeda',
    name: 'Amb. Hiroshi Takeda',
    title: 'Diplomatic Craft Advisor',
    tagline: 'The law is the last language of peace. I draft in it fluently.',
    expertise: ['Treaty drafting', 'Diplomatic correspondence', 'Historical-case reasoning', 'Track I tone'],
    bio: 'Thirty-year career diplomat and former Legal Adviser. Produces text that can be sent on headed paper — no placeholders, no brackets. Wields historical case comparison with precision.',
    color: '#A63D40',
    shape: 'star',
    signature: 'Draft a joint communiqué that preserves face for all parties',
  },
];

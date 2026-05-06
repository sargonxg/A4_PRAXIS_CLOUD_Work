import type { LandingCaseCard } from '@/types/case-module';
import { listLandingCaseCards } from '@/lib/cases/registry';

const COMING_SOON_CASES: LandingCaseCard[] = [
  {
    id: 'sahel-2026',
    title: 'Sahel Transitional Governance',
    region: 'West Africa',
    summary: 'Political-transition case module planned for regional governance and mediation workflows.',
    risk: 0,
    glaslStage: 0,
    tags: ['Coming soon', 'Political crisis'],
  },
  {
    id: 'us-housing-2026',
    title: 'US Housing Affordability',
    region: 'United States',
    summary: 'Policy and economic case module planned for affordability, zoning, and fiscal tradeoffs.',
    risk: 0,
    glaslStage: 0,
    tags: ['Coming soon', 'Policy'],
  },
  {
    id: 'workplace-2026',
    title: 'Workplace Mediation',
    region: 'Organizational',
    summary: 'Synthetic mediation case module planned for non-conflict workplace and HR use.',
    risk: 0,
    glaslStage: 0,
    tags: ['Coming soon', 'Mediation'],
  },
  {
    id: 'sanctions-2026',
    title: 'Sanctions Enforcement Audit',
    region: 'Multi-region',
    summary: 'Compliance case module planned for sanctions exposure, entities, and evidentiary support.',
    risk: 0,
    glaslStage: 0,
    tags: ['Coming soon', 'Compliance'],
  },
];

export interface LandingCaseCardView extends LandingCaseCard {
  available: boolean;
}

export function getLandingCaseCards(): LandingCaseCardView[] {
  const available = listLandingCaseCards().map((card) => ({ ...card, available: true }));
  const availableIds = new Set(available.map((card) => card.id));
  const placeholders = COMING_SOON_CASES
    .filter((card) => !availableIds.has(card.id))
    .map((card) => ({ ...card, available: false }));

  return [...available, ...placeholders].slice(0, 6);
}

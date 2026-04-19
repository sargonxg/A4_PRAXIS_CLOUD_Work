import type { Lens } from '@/types/analyst-profile';

export interface LensDef {
  label: string;
  description: string;
  color: string;        // hex
  sourceCategories: string[]; // ids that this lens biases retrieval toward
}

export const LENS_CATALOG: Record<Lens, LensDef> = {
  diplomatic: {
    label: 'Diplomatic',
    description: 'UN-body actions, bilateral/multilateral channels, peace process mechanics.',
    color: '#1B3A5C',
    sourceCategories: ['diplomatic-official', 'foundational'],
  },
  security: {
    label: 'Security',
    description: 'Armed groups, military balance, violence data, ceasefire compliance.',
    color: '#7C2D12',
    sourceCategories: ['conflict-security', 'military-intelligence'],
  },
  humanitarian: {
    label: 'Humanitarian',
    description: 'Displacement, protection, IHL violations, civilian impact, aid access.',
    color: '#C2410C',
    sourceCategories: ['humanitarian', 'news-media'],
  },
  economic: {
    label: 'Economic',
    description: 'Sanctions, trade, development indicators, conflict economies.',
    color: '#047857',
    sourceCategories: ['economic-development', 'think-tanks'],
  },
  legal_ihl: {
    label: 'Legal / IHL',
    description: 'International humanitarian law, war crimes, ICC/ICJ, treaty compliance.',
    color: '#4C1D95',
    sourceCategories: ['diplomatic-official', 'humanitarian'],
  },
  human_rights: {
    label: 'Human Rights',
    description: 'HRW/Amnesty/OHCHR reporting, protection, accountability.',
    color: '#9D174D',
    sourceCategories: ['humanitarian', 'news-media'],
  },
  development: {
    label: 'Development',
    description: 'Long-horizon stabilization, governance, SDG-linked work.',
    color: '#075985',
    sourceCategories: ['economic-development', 'think-tanks'],
  },
  mediation: {
    label: 'Mediation',
    description: 'Negotiation dynamics, process design, mediator neutrality.',
    color: '#B45309',
    sourceCategories: ['diplomatic-official', 'think-tanks'],
  },
  climate_security: {
    label: 'Climate-Security',
    description: 'Climate-stressor → conflict linkages, resource scarcity dynamics.',
    color: '#15803D',
    sourceCategories: ['economic-development', 'humanitarian'],
  },
};

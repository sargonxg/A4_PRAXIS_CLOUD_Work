export const CANONICAL_CAPSULE_CATEGORY_IDS = ['user', 'situation', 'tools', 'output'] as const;

export type CanonicalCapsuleCategoryId = (typeof CANONICAL_CAPSULE_CATEGORY_IDS)[number];
export type CapsuleCategoryAlias = CanonicalCapsuleCategoryId | 'users' | 'tool';

export interface CapsuleCanonicalCategoryDefinition {
  id: CanonicalCapsuleCategoryId;
  label: 'User' | 'Situation' | 'Tools' | 'Output';
  description: string;
  sections: string[];
  mappedCoreKinds: string[];
  inspectionFocus: string;
}

export const CAPSULE_CANONICAL_CATEGORY_DEFINITIONS: Record<CanonicalCapsuleCategoryId, CapsuleCanonicalCategoryDefinition> = {
  user: {
    id: 'user',
    label: 'User',
    description: 'User, institution, role, audience, language, preferences, tacit knowledge, red lines, and review posture for the subject writing or reading the product.',
    sections: ['Audience', 'Institution and role', 'Tacit knowledge', 'Preferences and red lines'],
    mappedCoreKinds: ['user', 'memory'],
    inspectionFocus: 'Inspect the human context that should shape tone, reasoning, assumptions, institutional constraints, and what PRAXIS must not infer.',
  },
  situation: {
    id: 'situation',
    label: 'Situation',
    description: 'The specific or general situation: sources, documents, concepts, claims, actors, timelines, reasoning, ontology, graph, and evidence gaps.',
    sections: ['Sources', 'Documents', 'Claims', 'Timeline', 'Ontology and graph'],
    mappedCoreKinds: ['situation', 'path', 'source', 'document', 'graph', 'time', 'objective'],
    inspectionFocus: 'Inspect the evidence and ontology that make the capsule grounded instead of generic: source receipts, concepts, relationships, uncertainty, and graph proposals.',
  },
  tools: {
    id: 'tools',
    label: 'Tools',
    description: 'Thinking devices and agent tools: stakeholder analysis, assumptions checks, sourceability, semantic layers, allowed actions, and review-gated workflows.',
    sections: ['Tools', 'Thinking devices', 'Agent workflow', 'Allowed actions'],
    mappedCoreKinds: ['tool'],
    inspectionFocus: 'Inspect the methods PRAXIS can apply, including what each tool is for, what evidence it needs, and which actions remain human-gated.',
  },
  output: {
    id: 'output',
    label: 'Output',
    description: 'Everything related to the written product: executive summary, structure, language, ideas, conclusion, citations, export rules, and handover format.',
    sections: ['Product shape', 'Executive summary', 'Language', 'Conclusion', 'Citations and handover'],
    mappedCoreKinds: ['product', 'output'],
    inspectionFocus: 'Inspect the artifact contract that tells Ask PRAXIS what to generate, how to structure it, which caveats must travel, and how review/export should work.',
  },
} as const;

export function normalizeCapsuleCategoryId(category: CapsuleCategoryAlias): CanonicalCapsuleCategoryId {
  if (category === 'users') return 'user';
  if (category === 'tool') return 'tools';
  return category;
}

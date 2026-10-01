export type PolicyMissionExample = {
  title: string;
  prompt: string;
  outcome: string;
};

export const POLICY_MISSION_EXAMPLES: PolicyMissionExample[] = [
  {
    title: 'Sanctions impact memo',
    prompt: 'Build a sanctions impact memo on proposed measures, exposed sectors, humanitarian risks, and evidence gaps.',
    outcome: 'Draft with sources and evidence gaps.',
  },
  {
    title: 'Treaty brief with citations',
    prompt: 'Create a treaty analysis with citations, key obligations, interpretive disputes, and implementation risks.',
    outcome: 'Citations and points to check.',
  },
  {
    title: 'Stakeholder map',
    prompt: 'Map stakeholders and use analysis of competing hypotheses for a crisis decision. Include assumptions and points for review.',
    outcome: 'Stakeholders, hypotheses and questions to review.',
  },
];

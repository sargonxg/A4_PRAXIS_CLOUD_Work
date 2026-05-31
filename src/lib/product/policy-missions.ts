export type PolicyMissionExample = {
  title: string;
  prompt: string;
  outcome: string;
};

export const POLICY_MISSION_EXAMPLES: PolicyMissionExample[] = [
  {
    title: 'Sanctions impact memo',
    prompt: 'Build a sanctions impact memo on proposed measures, exposed sectors, humanitarian risks, and evidence gaps.',
    outcome: 'Policy memo with source receipts, claim posture, and next evidence requests.',
  },
  {
    title: 'Treaty analysis with citations',
    prompt: 'Create a treaty analysis with citations, key obligations, interpretive disputes, and implementation risks.',
    outcome: 'Citable treaty brief with weak or unsupported paragraphs marked before export.',
  },
  {
    title: 'Stakeholder & ACH for a crisis',
    prompt: 'Map stakeholders and run ACH for a crisis decision, including competing hypotheses, assumptions, and red-team concerns.',
    outcome: 'Stakeholder map, ACH notes, and Boardroom-ready questions.',
  },
];

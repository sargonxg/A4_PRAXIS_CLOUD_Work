export type PolicyMissionExample = {
  title: string;
  prompt: string;
  outcome: string;
};

export const POLICY_MISSION_EXAMPLES: PolicyMissionExample[] = [
  {
    title: 'Sanctions impact memo',
    prompt: 'Build a sanctions impact memo on proposed measures, exposed sectors, humanitarian risks, and evidence gaps.',
    outcome: 'Memo with receipts and claim posture.',
  },
  {
    title: 'Treaty brief with citations',
    prompt: 'Create a treaty analysis with citations, key obligations, interpretive disputes, and implementation risks.',
    outcome: 'Weak paragraphs flagged before export.',
  },
  {
    title: 'Stakeholder map & ACH',
    prompt: 'Map stakeholders and run ACH for a crisis decision, including competing hypotheses, assumptions, and red-team concerns.',
    outcome: 'Hypotheses, assumptions, Boardroom questions.',
  },
];

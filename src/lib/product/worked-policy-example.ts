/** An invented teaching example, not research output or institutional evidence. */
export const WORKED_POLICY_EXAMPLE = {
  label: 'Synthetic worked example',
  title: 'Has a commitment become implementation?',
  disclosure: 'Every actor, note and fact below was invented for this demonstration. These are sample notes, not quotations from real documents or institutions.',
  capsuleDefinition: 'A Context Capsule saves the sources, assumptions and analytical approach you want PRAXIS to reuse.',
  question: 'What can a policy brief say about the Example Council proposal as of 30 September?',
  sourceNotes: [
    {
      id: 'A',
      title: 'Synthetic council note',
      content: 'The Example Council agreed on 20 September to review a proposal. The recorded review deadline is 1 October.',
    },
    {
      id: 'B',
      title: 'Synthetic working note',
      content: 'Funding approval is unconfirmed. These sample notes contain no payment records or report of completed operational activity.',
    },
  ],
  assessments: [
    { claim: 'Agreement to review', assessment: 'Recorded in sample note A. This is not an implementation mandate.', source: 'A' },
    { claim: 'Review outcome', assessment: 'Unknown on this record. A future deadline does not show whether review has started or finished.', source: 'A' },
    { claim: 'Actual expenditure', assessment: 'Unknown. Unconfirmed funding does not prove that no spending occurred.', source: 'B' },
    { claim: 'Operational implementation', assessment: 'Not established by these notes. Missing evidence is not proof that nothing happened.', source: 'A, B' },
  ],
  assumption: 'The assessment is limited to these two sample notes and the stated date. It makes no claim about events outside that record.',
  decision: 'Request the relevant review outcome, implementation mandate, financial records and operational evidence before describing the proposal as implemented.',
  reuse: 'Save the question, sample notes, analytical distinctions and open gaps together. For a follow-up brief, check what changed before reusing the assessment.',
} as const;

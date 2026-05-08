/**
 * Plain-language copy for the ACO Conflict Grammar primitives.
 * This is the analyst-facing description, not the engineering one.
 * Owned by GC; copy edits should preserve the discordant harmony /
 * concordia discors framing.
 */

export interface AcoEntityCopy {
  id: string;
  name: string;
  oneLiner: string;
  example: string;
  tier: 'core' | 'extended';
}

export const ACO_COPY: AcoEntityCopy[] = [
  {
    id: 'actor',
    name: 'Actor',
    oneLiner: 'Anyone who can act or be acted upon: a state, group, person, institution, coalition, or role.',
    example: '"The foreign ministry" is an actor; so is "the mediation team" and "the opposition coalition."',
    tier: 'core',
  },
  {
    id: 'claim',
    name: 'Claim',
    oneLiner: 'A position an actor takes: what they say is true, right, required, or unacceptable.',
    example: '"The ceasefire violations make talks impossible." The claim is the assertion, not whether it is correct.',
    tier: 'core',
  },
  {
    id: 'interest',
    name: 'Interest',
    oneLiner: 'What an actor actually wants, often beneath the stated claim.',
    example: 'A party may claim it wants reform while its interest is regime continuity or protected autonomy.',
    tier: 'core',
  },
  {
    id: 'constraint',
    name: 'Constraint',
    oneLiner: 'A condition that limits what an actor can do, regardless of what they want.',
    example: 'A fragile governing coalition can constrain what negotiators are able to concede.',
    tier: 'core',
  },
  {
    id: 'leverage',
    name: 'Leverage',
    oneLiner: 'A way one actor can influence another: power, dependency, access, incentive, threat, or pressure.',
    example: 'Border access, financing, sanctions relief, recognition, or security guarantees can become leverage.',
    tier: 'core',
  },
  {
    id: 'commitment',
    name: 'Commitment',
    oneLiner: 'A pledge an actor has made by agreement, public statement, mandate, precedent, or practice.',
    example: 'A signed monitoring arrangement is a commitment that shapes later bargaining room.',
    tier: 'core',
  },
  {
    id: 'event',
    name: 'Event',
    oneLiner: 'Something that happened, ideally with a date, place, actors, and verifiable consequences.',
    example: 'A ceasefire announcement, border incident, cabinet vote, arrest, or public speech.',
    tier: 'core',
  },
  {
    id: 'narrative',
    name: 'Narrative',
    oneLiner: 'A frame of meaning that organizes events, actors, and claims into a coherent story.',
    example: '"Stabilization through dialogue" and "capitulation through pressure" can describe the same episode differently.',
    tier: 'core',
  },
  {
    id: 'institution',
    name: 'Institution',
    oneLiner: 'A formal organization or rule-system that endures across individual actors.',
    example: 'A treaty body, regional organization, court, ceasefire commission, or monitoring mission.',
    tier: 'extended',
  },
  {
    id: 'norm',
    name: 'Norm',
    oneLiner: 'A shared expectation about what actors should or should not do.',
    example: 'The norm against targeting civilians or the expectation that parties respect agreed humanitarian access.',
    tier: 'extended',
  },
  {
    id: 'resource',
    name: 'Resource',
    oneLiner: 'Something material, financial, institutional, or informational an actor controls or seeks.',
    example: 'Oil reserves, port access, foreign reserves, logistics corridors, or weapons stockpiles.',
    tier: 'extended',
  },
  {
    id: 'risk',
    name: 'Risk',
    oneLiner: 'A future possibility with a probability, impact, timeframe, and warning indicators.',
    example: '"Risk of localized clashes spreading within 90 days, moderate probability, high impact."',
    tier: 'extended',
  },
  {
    id: 'policy',
    name: 'Policy',
    oneLiner: 'A standing decision about how an actor will behave in a class of situations.',
    example: 'A sanctions enforcement policy, no-contact policy, humanitarian access policy, or demobilization plan.',
    tier: 'extended',
  },
  {
    id: 'grievance',
    name: 'Grievance',
    oneLiner: 'A historical or unresolved harm that motivates present action.',
    example: 'A territorial loss, exclusion from political office, unaddressed violence, or unrepaired injustice.',
    tier: 'extended',
  },
];

export const ACO_THESIS_COPY = `
PRAXIS treats every conflict as a graph of these 14 entities and the
relations between them. The thesis is that disagreements that look
chaotic become tractable when you can name what is in dispute:
which claims, whose interests, under what constraints, with what
leverage, against which commitments. The grammar is shared; the
content is yours.
`.trim();

export const ACO_WORKED_EXAMPLE = {
  sentence: 'On April 30, the interim cabinet approved a border-monitoring extension, citing civilian stability concerns despite opposition from an armed faction.',
  decomposition: [
    { primitive: 'Event', text: 'April 30 cabinet vote to extend border monitoring' },
    { primitive: 'Actor', text: 'Interim cabinet, armed faction, monitoring mission' },
    { primitive: 'Institution', text: 'Monitoring mission' },
    { primitive: 'Claim', text: '"civilian stability requires continued monitoring"' },
    { primitive: 'Interest', text: 'Cabinet: preserve order and external support; faction: minimize outside scrutiny' },
    { primitive: 'Constraint', text: 'Domestic coalition pressure and field security limits' },
    { primitive: 'Commitment', text: 'Prior mandate language and earlier monitoring arrangements' },
  ],
} as const;

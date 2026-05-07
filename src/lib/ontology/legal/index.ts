import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export const LEGAL_ONTOLOGY: CaseOntologyDefinition = {
  id: 'legal',
  version: '1.0.0',
  label: 'Legal / Treaty Ontology',
  description: 'Legal provisions, parties, jurisdictional claims, reservations, precedents, compliance levers, and treaty commitments for legal and treaty-body analysis.',
  domains: ['legal', 'treaty', 'icc', 'icj', 'ihl', 'international-law', 'treaty-body-law'],
  nodeTypes: [
    { id: 'party', label: 'Party', primitive: 'Actor', description: 'State, international organization, applicant, respondent, counsel, chamber, or treaty party.' },
    { id: 'jurisdictional_claim', label: 'Jurisdictional Claim', primitive: 'Claim', description: 'Claim about jurisdiction, admissibility, obligation, breach, interpretation, or remedy.' },
    { id: 'protected_legal_interest', label: 'Protected Legal Interest', primitive: 'Interest', description: 'Interest protected by legal rule, treaty, mandate, or institutional procedure.' },
    { id: 'legal_provision', label: 'Legal Provision', primitive: 'Constraint', description: 'Treaty article, resolution, statute, reservation, customary rule, or procedural requirement.' },
    { id: 'procedural_lever', label: 'Procedural Lever', primitive: 'Leverage', description: 'Jurisdictional objection, provisional measure, referral, reporting cycle, or committee procedure.' },
    { id: 'treaty_commitment', label: 'Treaty Commitment', primitive: 'Commitment', description: 'Ratification, undertaking, compliance measure, reservation withdrawal, or remedial pledge.' },
    { id: 'procedural_event', label: 'Procedural Event', primitive: 'Event', description: 'Filing, hearing, judgment, committee review, reservation notice, or treaty action.' },
    { id: 'interpretive_frame', label: 'Interpretive Frame', primitive: 'Narrative', description: 'Legal theory, interpretive approach, or institutional framing of the dispute.' },
    { id: 'precedent', label: 'Precedent', primitive: 'Claim', description: 'Prior decision or legal authority invoked as persuasive or binding support.' },
  ],
  edgeTypes: [
    { id: 'invokes_provision', label: 'invokes provision', from: ['Actor', 'Claim'], to: ['Constraint'], description: 'Party or claim invokes a legal provision.' },
    { id: 'supports_interpretation', label: 'supports interpretation', from: ['Claim'], to: ['Narrative'], description: 'Precedent or argument supports an interpretive frame.' },
    { id: 'constrains_party', label: 'constrains party', from: ['Constraint'], to: ['Actor'], description: 'Provision constrains a party.' },
    { id: 'enables_procedure', label: 'enables procedure', from: ['Constraint'], to: ['Leverage'], description: 'Legal rule enables a procedural lever.' },
    { id: 'records_commitment', label: 'records commitment', from: ['Event'], to: ['Commitment'], description: 'Procedural event records or modifies a treaty commitment.' },
    { id: 'protects_interest', label: 'protects interest', from: ['Constraint'], to: ['Interest'], description: 'Provision protects a legal interest.' },
  ],
  validators: [
    { id: 'legal.provision-cited', label: 'Provision cited', severity: 'warn', description: 'Legal claims should cite at least one legal provision or authority.' },
    { id: 'legal.party-identified', label: 'Party identified', severity: 'warn', description: 'Legal analysis should identify the party or institution bound by the rule.' },
    { id: 'legal.procedure-dated', label: 'Procedure dated', severity: 'info', description: 'Procedural events should include dates.' },
    { id: 'legal.remedy-visible', label: 'Remedy visible', severity: 'info', description: 'Legal analysis should expose available remedies or commitments where relevant.' },
  ],
  recommendedToolIds: [
    'legal.provision-tracer',
    'legal.precedent-finder',
    'legal.reservation-effect-mapper',
    'legal.jurisdictional-analyzer',
    'cross.contradiction-finder',
    'cross.brief-exporter',
  ],
};

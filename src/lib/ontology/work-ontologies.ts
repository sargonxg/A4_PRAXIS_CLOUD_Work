import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';

export type WorkOntologyId =
  | 'foreign-policy-research'
  | 'domestic-policy-analysis'
  | 'corporate-strategic-analysis';

export interface WorkOntologyDefinition {
  id: WorkOntologyId;
  label: string;
  activeInMvp: boolean;
  description: string;
  primaryPersona: string;
  useCases: string[];
  primitiveSubtypes: Record<TacitusCorePrimitive, string[]>;
  mandatoryRelations: Array<{
    id: string;
    from: TacitusCorePrimitive;
    to: TacitusCorePrimitive;
    description: string;
  }>;
  externalMappings: string[];
}

export const WORK_ONTOLOGIES: WorkOntologyDefinition[] = [
  {
    id: 'foreign-policy-research',
    label: 'Foreign Policy Research',
    activeInMvp: true,
    primaryPersona: 'Foreign Policy Analyst',
    description: 'Research mandate ontology for policy scholars, research institutions, editorial workflows, and policymaker-facing outputs.',
    useCases: ['Research agenda setup', 'Source and peer review planning', 'Policy recommendation framing'],
    primitiveSubtypes: {
      Actor: ['ResearcherSelf', 'ResearchInstitution', 'EditorialBoard', 'FundingSource', 'MediaContact', 'AcademicPeer', 'PolicymakerAudience', 'ExternalSource'],
      Claim: ['ResearchHypothesis', 'EditorialPosition', 'MethodologicalChoice', 'EvidenceClaim'],
      Interest: ['PublicationGoal', 'IntellectualPositioning', 'FundingAlignment', 'PolicyInfluence'],
      Constraint: ['PublicationDeadline', 'EthicalReview', 'EditorialStandards', 'FundingScope', 'AcademicStandards'],
      Leverage: ['PublicationVenue', 'CitationCapital', 'NetworkAccess', 'MethodologicalCredibility'],
      Commitment: ['PublicationDeliverable', 'ConferencePresentation', 'EditorialOutput', 'PeerReviewResponse'],
      Event: ['ResearchCycle', 'PeerReviewMilestone', 'PublicationLaunch', 'ConferenceParticipation'],
      Narrative: ['AnalyticalFraming', 'PolicyRecommendationFraming', 'MethodologyNarrative', 'LiteraturePositioning'],
    },
    mandatoryRelations: [
      { id: 'claim-supported-by-source', from: 'Claim', to: 'Actor', description: 'Every research claim must identify source or peer support.' },
      { id: 'output-bound-by-constraint', from: 'Commitment', to: 'Constraint', description: 'Deliverables inherit publication and ethics constraints.' },
      { id: 'framing-serves-interest', from: 'Narrative', to: 'Interest', description: 'Recommendation framing must declare the research objective it serves.' },
    ],
    externalMappings: ['BFO:InformationContentEntity', 'CCO:AgentRole', 'FrameNet:Research', 'PLOVER:Source'],
  },
  {
    id: 'domestic-policy-analysis',
    label: 'Domestic Policy Analysis',
    activeInMvp: true,
    primaryPersona: 'Domestic Policy Analyst',
    description: 'Policy office ontology for legislative, regulatory, budgetary, coalition, and constituent-facing work.',
    useCases: ['Hearing preparation', 'Regulatory landscape tracking', 'Policy memo drafting'],
    primitiveSubtypes: {
      Actor: ['AnalystSelf', 'Supervisor', 'Principal', 'CommitteeMember', 'AdvocacyOrgPartner', 'JournalistContact', 'SubjectMatterExpert', 'ConstituentAudience'],
      Claim: ['PolicyPosition', 'RegulatoryInterpretation', 'EvidenceClaim', 'PoliticalViability'],
      Interest: ['PolicyOutcome', 'ElectoralInterest', 'BudgetaryInterest', 'CoalitionInterest'],
      Constraint: ['LegislativeCalendar', 'BudgetCycle', 'ProcessConstraint', 'PartisanFraming', 'LegalStandard', 'EthicalRule'],
      Leverage: ['CommitteeAssignment', 'MediaAccess', 'CoalitionStrength', 'ConstituentBase', 'EvidenceQuality'],
      Commitment: ['HearingTestimony', 'PolicyMemoCommit', 'BudgetRequest', 'RegulatoryCommentLetter'],
      Event: ['HearingCycle', 'BudgetCycle', 'RegulatoryRulemaking', 'ElectionCycle', 'CommitteeMarkup', 'LegislativeSession'],
      Narrative: ['PolicyFraming', 'BipartisanFraming', 'ConstituentFraming', 'AdministrativeFraming'],
    },
    mandatoryRelations: [
      { id: 'position-has-principal', from: 'Claim', to: 'Actor', description: 'Policy claims must identify the principal or audience.' },
      { id: 'calendar-constrains-commitment', from: 'Constraint', to: 'Commitment', description: 'Deadlines and process rules bound office deliverables.' },
      { id: 'coalition-enables-leverage', from: 'Interest', to: 'Leverage', description: 'Coalition interest must map to concrete leverage.' },
    ],
    externalMappings: ['BFO:Process', 'CCO:Organization', 'FrameNet:Legality', 'POLECAT:PoliticalEvent'],
  },
  {
    id: 'corporate-strategic-analysis',
    label: 'Corporate Strategic Analysis',
    activeInMvp: true,
    primaryPersona: 'Corporate Strategic Analyst',
    description: 'Enterprise strategy ontology for board, investor, regulator, NGO, reputation, and sustainability analysis.',
    useCases: ['Board briefing', 'Sustainability and regulatory outlook', 'Reputational risk analysis'],
    primitiveSubtypes: {
      Actor: ['AnalystSelf', 'ExecutiveSupervisor', 'BoardAudience', 'InvestorAudience', 'RegulatorActor', 'NGOActor', 'JournalistContact', 'IndustryPeer', 'EmployeeAudience', 'CustomerAudience'],
      Claim: ['StrategicPosition', 'RegulatoryComplianceClaim', 'MaterialityAssessment', 'StakeholderClaim', 'FinancialClaim'],
      Interest: ['ShareholderValue', 'RegulatoryAlignment', 'ReputationalProtection', 'StrategicPositioning', 'ESGCredibility'],
      Constraint: ['SECDisclosure', 'RegulatoryRule', 'BoardMandate', 'FinancialPosture', 'ESGStandard', 'ReputationalRisk'],
      Leverage: ['MarketPosition', 'RegulatoryRelationship', 'MediaRelationship', 'InvestorBacking', 'CertificationCredibility'],
      Commitment: ['SustainabilityPledge', 'RegulatoryCommitment', 'BoardDirective', 'DisclosureCommitment', 'StakeholderEngagement'],
      Event: ['BoardMeeting', 'EarningsCall', 'SustainabilityReportRelease', 'RegulatoryFiling', 'NGOCampaignEvent', 'ESGRatingEvent'],
      Narrative: ['CorporateFraming', 'ESGFraming', 'ReputationalFraming', 'InvestorFraming'],
    },
    mandatoryRelations: [
      { id: 'claim-linked-to-disclosure', from: 'Claim', to: 'Constraint', description: 'Material claims must identify disclosure and regulatory constraints.' },
      { id: 'stakeholder-maps-to-interest', from: 'Actor', to: 'Interest', description: 'Stakeholder actors must map to enterprise interests.' },
      { id: 'commitment-has-evidence-event', from: 'Commitment', to: 'Event', description: 'Corporate commitments must be tied to filings, reports, or board events.' },
    ],
    externalMappings: ['BFO:Disposition', 'CCO:CommercialOrganization', 'FrameNet:Reputation', 'POLECAT:EconomicEvent'],
  },
];

export const DEFERRED_WORK_ONTOLOGIES = [
  'Campaign Intelligence',
  'Legal Case Analysis',
  'Journalistic Investigation',
  'Grant Strategy',
  'Crisis Communications',
];

export function getWorkOntology(id: string): WorkOntologyDefinition | null {
  return WORK_ONTOLOGIES.find((ontology) => ontology.id === id) ?? null;
}

export function getDomainOntologyCards() {
  return CASE_ONTOLOGIES.map((ontology) => ({
    ...ontology,
    activeInMvp: ['conflict', 'mediation', 'humanitarian'].includes(ontology.id),
  }));
}

/**
 * Provenance Chain Types — Part 4 P18
 * Tracks source attribution for AI-generated claims.
 */

export type ProvenanceSource =
  | 'GDELT'
  | 'ACLED'
  | 'ReliefWeb'
  | 'UNHCR'
  | 'HDX'
  | 'WorldBank'
  | 'UCDP'
  | 'UNNews'
  | 'SIPRI'
  | 'CrisisGroup'
  | 'Firecrawl'
  | 'Tavily'
  | 'GraphRAG'
  | 'SKC'
  | 'AI Assessment'
  | 'User Document'
  | 'External URL';

export interface ProvenanceClaim {
  id: string;
  /** The specific claim or statement being attributed */
  claim: string;
  /** Primary data sources */
  sources: ProvenanceSource[];
  /** Tool that generated this claim */
  toolId: string;
  /** Situation this belongs to */
  situationId: string;
  /** Confidence level for this specific claim */
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  /** ISO timestamp when the claim was generated */
  generatedAt: string;
  /** Optional URL references */
  urls?: string[];
  /** AI model used to generate */
  model?: string;
}

export type AnnotationType = 'agree' | 'disagree' | 'correct' | 'enhance' | 'question' | 'classify';

export interface Annotation {
  id: string;
  /** Which tool output was annotated */
  toolId: string;
  situationId: string;
  /** Path within tool output (e.g., 'findings[0].point') */
  targetPath?: string;
  /** The annotated text snippet */
  targetText?: string;
  type: AnnotationType;
  note: string;
  /** Correction or enhancement text */
  correction?: string;
  createdAt: string;
  createdBy: string;
}

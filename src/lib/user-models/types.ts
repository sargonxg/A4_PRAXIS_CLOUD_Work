export type WorkOntologyId =
  | 'foreign-policy-research'
  | 'domestic-policy-analysis'
  | 'corporate-strategic-analysis';

export interface OutputPreferences {
  citationFormat: string;
  briefVsLong: 'brief' | 'long' | 'adaptive';
  languagePosture: string;
}

export interface SourcePreferences {
  trusted: string[];
  deprioritized: string[];
  languages: string[];
}

export interface UserModelFields {
  identity: string;
  role: string;
  mandate: string;
  organization?: string;
  methodologyToolkit: string[];
  communicationStyle: string;
  confidenceTolerance: 'low' | 'medium' | 'high';
  defaultOntologyStacks: Record<string, string[]>;
  toolAffinities: string[];
  standingAssumptions: string[];
  prohibitedFrames: string[];
  outputPreferences: OutputPreferences;
  sourcePreferences: SourcePreferences;
  parentModelId?: string | null;
  workOntologyId: WorkOntologyId;
  audienceDefaults: string[];
}

export interface UserModelRecord extends UserModelFields {
  modelId: string;
  ownerUid: string | '_public';
  visibility: 'public-seed' | 'private';
  version: number;
  forkCount: number;
  publishedAt?: string;
}

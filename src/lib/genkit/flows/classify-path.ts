import { z } from 'genkit';
import { ai, gemini25Flash } from '@/lib/genkit';
import {
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_PATH_PROFILES,
  type PolicyPathId,
  type PolicyPathProfile,
} from '@/lib/product/context-capsules';
import {
  GenkitClassifyPathInputSchema,
  GenkitClassifyPathOutputSchema,
} from '@/lib/genkit/schemas/classify-path';

export const ClassifyPathFlowInputSchema = z.object({
  domainId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  sourceUrls: z.array(z.string()).default([]),
});

const PolicyPathIdSchema = z.string().refine((value): value is PolicyPathId => isPolicyPathId(value), {
  message: 'Unknown PRAXIS policy path id',
});

const SuggestedUserCoreSchema = z.object({
  role: z.string(),
  audience: z.string(),
  workingStyle: z.string(),
  evidencePosture: z.string(),
});

const SuggestedSituationCoreSchema = z.object({
  problemFrame: z.string(),
  actors: z.array(z.string()),
  geography: z.string().nullable(),
  decisionContext: z.string(),
  timeHorizon: z.string(),
});

export const ClassifyPathFlowOutputSchema = z.object({
  policyPathId: PolicyPathIdSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  suggestedUserCore: SuggestedUserCoreSchema,
  suggestedSituationCore: SuggestedSituationCoreSchema,
  suggestedTools: z.array(z.string()),
  suggestedOutputs: z.array(z.string()),
  missingInformationQuestions: z.array(z.string()),
  alternates: z.array(z.object({
    id: PolicyPathIdSchema,
    confidence: z.number().min(0).max(1),
  })),
});

export type ClassifyPathFlowInput = z.infer<typeof ClassifyPathFlowInputSchema>;
export type ClassifyPathFlowOutput = z.infer<typeof ClassifyPathFlowOutputSchema>;

export const classifyPathFlow = ai.defineFlow(
  {
    name: 'classifyPath',
    inputSchema: ClassifyPathFlowInputSchema,
    outputSchema: ClassifyPathFlowOutputSchema,
  },
  async (input) => {
    const seedText = [
      input.name,
      input.description,
      ...(input.sourceUrls ?? []),
    ].filter(Boolean).join('\n');

    if (!seedText.trim()) {
      return buildOutputForProfile(getProfile('generic-policy'), 0, 'No seed text was provided.', []);
    }

    try {
      const prompt = ai.prompt<
        typeof GenkitClassifyPathInputSchema,
        typeof GenkitClassifyPathOutputSchema
      >('classify-path');
      const { output } = await prompt({
        domainId: input.domainId,
        seedText,
        pathCatalogue: buildPathCatalogue(),
      }, {
        model: gemini25Flash,
        config: { temperature: 0 },
      });
      const parsed = GenkitClassifyPathOutputSchema.parse(output);
      return normalizeOutput(parsed);
    } catch (err) {
      console.warn('[genkit/classify-path] falling back to deterministic classifier:', err);
      return deterministicClassifyPolicyPath(seedText, input.domainId);
    }
  },
);

function buildPathCatalogue(): string {
  return POLICY_PATH_PROFILES.map((profile) => {
    const templates = profile.defaultTemplates
      .map((templateId) => CONTEXT_CAPSULE_TEMPLATES.find((template) => template.id === templateId))
      .filter(Boolean)
      .map((template) => `${template?.label}: ${template?.prompt}`)
      .join('; ');
    return [
      `id=${profile.id}`,
      `label=${profile.label}`,
      `userFrame=${profile.userFrame}`,
      `templates=${templates}`,
      `tools=${profile.suggestedTools.join(', ')}`,
      `outputs=${profile.suggestedOutputs.join(', ')}`,
    ].join(' | ');
  }).join('\n');
}

function normalizeOutput(output: {
  policyPathId: string;
  confidence: number;
  rationale: string;
  suggestedUserCore: z.infer<typeof SuggestedUserCoreSchema>;
  suggestedSituationCore: z.infer<typeof SuggestedSituationCoreSchema>;
  suggestedTools: string[];
  suggestedOutputs: string[];
  missingInformationQuestions: string[];
  alternates: Array<{ id: string; confidence: number }>;
}): ClassifyPathFlowOutput {
  const profile = isPolicyPathId(output.policyPathId)
    ? getProfile(output.policyPathId)
    : getProfile('generic-policy');
  const alternates = output.alternates
    .filter((alt): alt is { id: PolicyPathId; confidence: number } => isPolicyPathId(alt.id) && alt.id !== profile.id)
    .slice(0, 3)
    .map((alt) => ({ id: alt.id, confidence: clamp01(alt.confidence) }));

  return {
    policyPathId: profile.id,
    confidence: clamp01(output.confidence),
    rationale: output.rationale.slice(0, 400),
    suggestedUserCore: {
      role: output.suggestedUserCore.role.slice(0, 120) || profile.label,
      audience: output.suggestedUserCore.audience.slice(0, 160) || defaultAudience(profile),
      workingStyle: output.suggestedUserCore.workingStyle.slice(0, 220) || defaultWorkingStyle(profile),
      evidencePosture: output.suggestedUserCore.evidencePosture.slice(0, 220) || defaultEvidencePosture(),
    },
    suggestedSituationCore: {
      problemFrame: output.suggestedSituationCore.problemFrame.slice(0, 260) || defaultProblemFrame(profile),
      actors: output.suggestedSituationCore.actors.map((actor) => actor.slice(0, 80)).filter(Boolean).slice(0, 8),
      geography: output.suggestedSituationCore.geography?.slice(0, 120) || null,
      decisionContext: output.suggestedSituationCore.decisionContext.slice(0, 220) || defaultDecisionContext(profile),
      timeHorizon: output.suggestedSituationCore.timeHorizon.slice(0, 120) || 'Current decision window',
    },
    suggestedTools: normalizeSuggestions(output.suggestedTools, profile.suggestedTools),
    suggestedOutputs: normalizeSuggestions(output.suggestedOutputs, profile.suggestedOutputs),
    missingInformationQuestions: output.missingInformationQuestions
      .map((question) => question.trim().slice(0, 180))
      .filter(Boolean)
      .slice(0, 5),
    alternates,
  };
}

function deterministicClassifyPolicyPath(seedText: string, domainId?: string): ClassifyPathFlowOutput {
  const haystack = tokenize(`${domainId ?? ''} ${seedText}`);
  const scored = POLICY_PATH_PROFILES.map((profile) => {
    const profileText = [
      profile.id.replace(/-/g, ' '),
      profile.label,
      profile.userFrame,
      profile.defaultTemplates.join(' '),
      profile.suggestedTools.join(' '),
      profile.suggestedOutputs.join(' '),
      ...profile.defaultTemplates.map((templateId) => {
        const template = CONTEXT_CAPSULE_TEMPLATES.find((item) => item.id === templateId);
        return template ? `${template.label} ${template.prompt} ${template.audience} ${template.output}` : '';
      }),
    ].join(' ');
    return {
      profile,
      score: overlapScore(haystack, tokenize(profileText)),
    };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const generic = getProfile('generic-policy');
  if (!top || top.score < 2) {
    return buildOutputForProfile(
      generic,
      0.24,
      'The prompt is too broad to select a specific policy path with confidence.',
      scored.filter((item) => item.profile.id !== generic.id).slice(0, 3).map((item) => ({
        id: item.profile.id,
        confidence: Math.max(0.12, Math.min(0.36, item.score / 12)),
      })),
      true,
    );
  }

  const confidence = Math.max(0.42, Math.min(0.9, 0.34 + (top.score / Math.max(12, haystack.size + 4))));
  return buildOutputForProfile(
    top.profile,
    confidence,
    `Policy path selected from prompt overlap with ${top.profile.label} defaults.`,
    scored.filter((item) => item.profile.id !== top.profile.id && item.score > 0).slice(0, 3).map((item) => ({
      id: item.profile.id,
      confidence: Math.max(0.18, Math.min(0.72, item.score / Math.max(top.score + 3, 4))),
    })),
    confidence < 0.65,
  );
}

function buildOutputForProfile(
  profile: PolicyPathProfile,
  confidence: number,
  rationale: string,
  alternates: Array<{ id: PolicyPathId; confidence: number }>,
  includeBasicQuestions = false,
): ClassifyPathFlowOutput {
  return {
    policyPathId: profile.id,
    confidence: clamp01(confidence),
    rationale,
    suggestedUserCore: {
      role: profile.label,
      audience: defaultAudience(profile),
      workingStyle: defaultWorkingStyle(profile),
      evidencePosture: defaultEvidencePosture(),
    },
    suggestedSituationCore: {
      problemFrame: defaultProblemFrame(profile),
      actors: [],
      geography: null,
      decisionContext: defaultDecisionContext(profile),
      timeHorizon: 'Current decision window',
    },
    suggestedTools: profile.suggestedTools.slice(0, 5),
    suggestedOutputs: profile.suggestedOutputs.slice(0, 4),
    missingInformationQuestions: missingQuestionsFor(profile, includeBasicQuestions),
    alternates: alternates.map((alt) => ({ id: alt.id, confidence: clamp01(alt.confidence) })),
  };
}

function missingQuestionsFor(profile: PolicyPathProfile, includeBasicQuestions: boolean): string[] {
  const questions = [
    'What decision or output should this capsule support first?',
    'Which sources, documents, or links should PRAXIS treat as initial evidence?',
  ];
  if (includeBasicQuestions) {
    questions.unshift('Which policy domain or working path best describes this work?');
  }
  if (profile.id === 'legal-compliance') {
    questions.push('Which rule set, jurisdiction, or compliance standard should anchor the review?');
  } else if (profile.id === 'hr-policy') {
    questions.push('Which employee groups, policies, and approval steps are affected?');
  } else if (profile.id === 'crisis-management') {
    questions.push('What is the current deadline, escalation threshold, or decision window?');
  } else {
    questions.push('Who are the main actors, stakeholders, or reviewers?');
  }
  return questions.slice(0, 5);
}

function defaultAudience(profile: PolicyPathProfile): string {
  return profile.userFrame.split(',')[0]?.trim() || profile.label;
}

function defaultWorkingStyle(profile: PolicyPathProfile): string {
  return `Work from the ${profile.label} path with source gaps and review needs visible.`;
}

function defaultEvidencePosture(): string {
  return 'Prefer sourceable claims, preserve uncertainty, and keep unsupported assumptions out of final outputs.';
}

function defaultProblemFrame(profile: PolicyPathProfile): string {
  return profile.userFrame;
}

function defaultDecisionContext(profile: PolicyPathProfile): string {
  return `Prepare ${profile.suggestedOutputs[0] ?? 'a policy output'} with enough context for review.`;
}

function normalizeSuggestions(values: string[], fallback: string[]): string[] {
  const seen = new Set<string>();
  return [...values, ...fallback]
    .map((value) => value.trim().slice(0, 80))
    .filter((value) => {
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    })
    .slice(0, 6);
}

function isPolicyPathId(value: unknown): value is PolicyPathId {
  return typeof value === 'string' && POLICY_PATH_PROFILES.some((profile) => profile.id === value);
}

function getProfile(id: PolicyPathId): PolicyPathProfile {
  return POLICY_PATH_PROFILES.find((profile) => profile.id === id) ?? POLICY_PATH_PROFILES[0];
}

function tokenize(value: string): Set<string> {
  const stop = new Set(['and', 'the', 'for', 'with', 'from', 'this', 'that', 'into', 'what', 'which', 'their', 'about']);
  return new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2 && !stop.has(token)));
}

function overlapScore(input: Set<string>, profile: Set<string>): number {
  let score = 0;
  for (const token of input) {
    if (profile.has(token)) score += token.length > 7 ? 2 : 1;
  }
  return score;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

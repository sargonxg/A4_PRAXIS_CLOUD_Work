import {
  buildSourceabilityClaimVerdicts,
  sourceabilityVerdictForSupportLabel,
  type SourceabilityClaimVerdict,
  type SourceabilitySupportLabel,
  type SourceabilityVerdict,
} from '@/lib/agent-runtime/sourceability-ledger';
import type { AskPraxisDelegateResult } from '@/lib/ai/ask-praxis';
import type { OutputConstraints } from '@/lib/context/system-prompt-block';

export interface MemoClaimCheckReceipt {
  sourceId: string;
  title: string;
  quote: string;
  citation?: string;
  layer?: string;
  confidence: number | null;
}

export interface MemoClaimCheckResult {
  kind: 'claim-check';
  claim: string;
  verdict: SourceabilityVerdict;
  rationale: string;
  receipt: MemoClaimCheckReceipt | null;
  sourceabilityVerdicts: SourceabilityClaimVerdict[];
  provenance: {
    profileVersion: number;
    toolRunId: string | null;
    generatedAt: string;
  };
}

export type MemoLanguageViolationKind = 'red_line' | 'language' | 'audience_tone';
export type MemoLanguageViolationSeverity = 'high' | 'medium' | 'low';

export interface MemoLanguageViolation {
  id: string;
  kind: MemoLanguageViolationKind;
  severity: MemoLanguageViolationSeverity;
  phrase: string;
  message: string;
  suggestion: string;
  start: number;
  end: number;
}

export interface MemoLanguageCheckResult {
  kind: 'language-check';
  checkedText: string;
  constraints: OutputConstraints;
  violations: MemoLanguageViolation[];
  summary: string;
  provenance: {
    profileVersion: number;
    toolRunId: string | null;
    generatedAt: string;
  };
}

export type MemoExportGateBlocker =
  | 'classification-required'
  | 'sourceability-required'
  | 'sourceability-blocked'
  | 'redline-required'
  | 'redline-blocked';

export interface MemoExportGate {
  ready: boolean;
  label: string;
  detail: string;
  blockers: MemoExportGateBlocker[];
  sourceabilityStatus: 'not_run' | 'passed' | 'weak' | 'blocked';
  redlineStatus: 'not_run' | 'passed' | 'blocked';
  classificationStatus: 'missing' | 'set';
  latestClaimCheck: MemoClaimCheckResult | null;
  latestLanguageCheck: MemoLanguageCheckResult | null;
}

export function buildMemoClaimCheckQuestion(input: {
  claim: string;
  capsuleId?: string | null;
}): string {
  return [
    'Check this selected memo claim against the active capsule and retrieved situation corpus.',
    input.capsuleId
      ? `Active ContextCapsule: ${input.capsuleId}. Treat its source and document receipts as the primary evidence surface.`
      : 'No active ContextCapsule id was provided; if evidence is thin, mark the verdict unsupported or weak rather than filling gaps from model prior.',
    'Return only a structured verdict. Use "supported" when a source directly supports it, "contradicted" when a source conflicts with it, "weak" for partial support, and "unsupported" when no attached source supports it.',
    `Selected claim:\n${input.claim}`,
  ].join('\n\n');
}

export function buildMemoClaimCheckResult(input: {
  claim: string;
  delegateResult: Pick<AskPraxisDelegateResult, 'text' | 'output' | 'citations'>;
  profileVersion: number;
  toolRunId: string | null;
  generatedAt?: string;
}): MemoClaimCheckResult {
  const rawOutput = isRecord(input.delegateResult.output) ? input.delegateResult.output : {};
  const supportLabel = supportLabelFromDelegateOutput(rawOutput, input.delegateResult.text);
  const firstCitation = input.delegateResult.citations[0] ?? null;
  const sourceId = stringValue(rawOutput.sourceId)
    ?? stringValue(rawOutput.source_id)
    ?? firstCitation?.citation
    ?? firstCitation?.title
    ?? null;
  const title = stringValue(rawOutput.sourceTitle)
    ?? stringValue(rawOutput.source_title)
    ?? firstCitation?.title
    ?? sourceId
    ?? 'Capsule source';
  const quote = stringValue(rawOutput.quote) ?? stringValue(rawOutput.evidence) ?? '';
  const rationale = stringValue(rawOutput.rationale)
    ?? stringValue(rawOutput.reason)
    ?? input.delegateResult.text.trim()
    ?? 'PRAXIS checked the selected claim against the active capsule sources.';
  const sourceabilityVerdicts = buildSourceabilityClaimVerdicts([{
    claim: input.claim,
    supportLabel,
    sourceIds: sourceId ? [sourceId] : [],
    confidence: confidenceForSupportLabel(supportLabel),
    reviewNote: rationale,
  }]);

  return {
    kind: 'claim-check',
    claim: input.claim,
    verdict: sourceabilityVerdictForSupportLabel(supportLabel),
    rationale,
    receipt: sourceId ? {
      sourceId,
      title,
      quote,
      citation: firstCitation?.citation ?? sourceId,
      layer: firstCitation?.layer,
      confidence: confidenceForSupportLabel(supportLabel),
    } : null,
    sourceabilityVerdicts,
    provenance: {
      profileVersion: input.profileVersion,
      toolRunId: input.toolRunId,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
    },
  };
}

export function deriveMemoExportGate(input: {
  classification: string | null | undefined;
  checkResults: Array<MemoClaimCheckResult | MemoLanguageCheckResult>;
}): MemoExportGate {
  const latestClaimCheck = latestByGeneratedAt(input.checkResults.filter(isClaimCheck));
  const latestLanguageCheck = latestByGeneratedAt(input.checkResults.filter(isLanguageCheck));
  const blockers: MemoExportGateBlocker[] = [];
  const classificationStatus: MemoExportGate['classificationStatus'] = input.classification?.trim() ? 'set' : 'missing';
  if (classificationStatus === 'missing') blockers.push('classification-required');

  const sourceabilityStatus = sourceabilityGateStatus(latestClaimCheck);
  if (sourceabilityStatus === 'not_run') blockers.push('sourceability-required');
  if (sourceabilityStatus === 'weak' || sourceabilityStatus === 'blocked') blockers.push('sourceability-blocked');

  const redlineStatus = redlineGateStatus(latestLanguageCheck);
  if (redlineStatus === 'not_run') blockers.push('redline-required');
  if (redlineStatus === 'blocked') blockers.push('redline-blocked');

  const ready = blockers.length === 0;
  return {
    ready,
    label: ready ? 'Export ready' : 'Export blocked',
    detail: ready
      ? 'Sourceability, red-line, and classification gates passed.'
      : exportGateDetail(blockers),
    blockers,
    sourceabilityStatus,
    redlineStatus,
    classificationStatus,
    latestClaimCheck,
    latestLanguageCheck,
  };
}

export function checkMemoLanguageConstraints(
  text: string,
  constraints: OutputConstraints,
  options: { profileVersion?: number; toolRunId?: string | null; generatedAt?: string } = {},
): MemoLanguageCheckResult {
  const checkedText = text.slice(0, 20_000);
  const violations = [
    ...findRedLineViolations(checkedText, constraints.redLineClauses),
    ...findLanguageViolations(checkedText, constraints.language),
    ...findAudienceToneViolations(checkedText, constraints.audienceTone),
  ];
  return {
    kind: 'language-check',
    checkedText,
    constraints,
    violations,
    summary: violations.length
      ? `${violations.length} issue${violations.length === 1 ? '' : 's'} found against output constraints.`
      : 'No language issues found against output constraints.',
    provenance: {
      profileVersion: options.profileVersion ?? 0,
      toolRunId: options.toolRunId ?? null,
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    },
  };
}

function findRedLineViolations(text: string, redLineClauses: string[]): MemoLanguageViolation[] {
  const violations: MemoLanguageViolation[] = [];
  const seen = new Set<string>();
  for (const clause of redLineClauses) {
    const phrase = clause.trim();
    if (!phrase) continue;
    const needle = phrase.toLowerCase();
    const lower = text.toLowerCase();
    let start = lower.indexOf(needle);
    while (start >= 0) {
      const key = `red-line:${needle}:${start}`;
      if (!seen.has(key)) {
        seen.add(key);
        violations.push({
          id: key,
          kind: 'red_line',
          severity: 'high',
          phrase,
          start,
          end: start + phrase.length,
          message: `Red-line phrase "${phrase}" appears in the memo text.`,
          suggestion: 'Replace or qualify this phrase before sharing the memo.',
        });
      }
      start = lower.indexOf(needle, start + Math.max(1, needle.length));
    }
  }
  return violations;
}

function findLanguageViolations(text: string, language: OutputConstraints['language']): MemoLanguageViolation[] {
  if (language === 'en') return [];
  const asciiLetters = text.match(/[a-z]/gi)?.length ?? 0;
  const nonAsciiLetters = text.match(/[^\x00-\x7F]/g)?.length ?? 0;
  if (asciiLetters < 120 || nonAsciiLetters > asciiLetters * 0.1) return [];
  return [{
    id: `language:${language}:0`,
    kind: 'language',
    severity: 'medium',
    phrase: text.slice(0, 80),
    start: 0,
    end: Math.min(80, text.length),
    message: `Output constraints request ${language}, but the checked text appears primarily English.`,
    suggestion: `Rewrite the selected passage in ${language}.`,
  }];
}

function findAudienceToneViolations(text: string, audienceTone: OutputConstraints['audienceTone']): MemoLanguageViolation[] {
  if (audienceTone !== 'senior_leadership' && audienceTone !== 'external_partners' && audienceTone !== 'public') return [];
  const tonePhrases = ['no-brainer', 'obviously', 'just', 'sort of', 'kind of'];
  const lower = text.toLowerCase();
  return tonePhrases.flatMap((phrase) => {
    const start = lower.indexOf(phrase);
    if (start < 0) return [];
    return [{
      id: `audience-tone:${phrase}:${start}`,
      kind: 'audience_tone' as const,
      severity: 'low' as const,
      phrase,
      start,
      end: start + phrase.length,
      message: `"${phrase}" may be too casual for ${audienceTone.replace(/_/g, ' ')}.`,
      suggestion: 'Use a more formal policy register.',
    }];
  });
}

function supportLabelFromDelegateOutput(output: Record<string, unknown>, text: string): SourceabilitySupportLabel {
  const raw = stringValue(output.verdict) ?? stringValue(output.supportLabel) ?? stringValue(output.support_label);
  if (raw === 'supported' || raw === 'weak' || raw === 'contradicted' || raw === 'unsupported') return raw;
  if (raw === 'model_prior' || raw === 'assumption') return raw;
  if (/\bcontradict|conflict|refute/i.test(text)) return 'contradicted';
  if (/\bsupport|corroborat|confirm/i.test(text)) return 'supported';
  return 'unsupported';
}

function sourceabilityGateStatus(claimCheck: MemoClaimCheckResult | null): MemoExportGate['sourceabilityStatus'] {
  if (!claimCheck) return 'not_run';
  if (claimCheck.verdict === 'supported') return 'passed';
  if (claimCheck.verdict === 'weak') return 'weak';
  return 'blocked';
}

function redlineGateStatus(languageCheck: MemoLanguageCheckResult | null): MemoExportGate['redlineStatus'] {
  if (!languageCheck) return 'not_run';
  return languageCheck.violations.some((violation) => violation.kind === 'red_line' && violation.severity === 'high')
    ? 'blocked'
    : 'passed';
}

function latestByGeneratedAt<T extends { provenance: { generatedAt: string } }>(items: T[]): T | null {
  if (!items.length) return null;
  return [...items].sort((a, b) => b.provenance.generatedAt.localeCompare(a.provenance.generatedAt))[0] ?? null;
}

function isClaimCheck(value: MemoClaimCheckResult | MemoLanguageCheckResult): value is MemoClaimCheckResult {
  return value.kind === 'claim-check';
}

function isLanguageCheck(value: MemoClaimCheckResult | MemoLanguageCheckResult): value is MemoLanguageCheckResult {
  return value.kind === 'language-check';
}

function exportGateDetail(blockers: MemoExportGateBlocker[]): string {
  const details = blockers.map((blocker) => {
    switch (blocker) {
      case 'classification-required':
        return 'set a classification';
      case 'sourceability-required':
        return 'run a claim/sourceability check';
      case 'sourceability-blocked':
        return 'resolve weak, contradicted, or unsupported claim evidence';
      case 'redline-required':
        return 'run a language/red-line check';
      case 'redline-blocked':
        return 'remove red-line phrases';
    }
  });
  return `Before export: ${Array.from(new Set(details)).join('; ')}.`;
}

function confidenceForSupportLabel(label: SourceabilitySupportLabel): number {
  if (label === 'supported') return 0.85;
  if (label === 'weak') return 0.55;
  if (label === 'contradicted') return 0.15;
  if (label === 'model_prior') return 0.35;
  if (label === 'assumption') return 0.25;
  return 0.1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

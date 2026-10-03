'use client';

import type { Condition, Knowledge } from '@/lib/cognitive-capsule/types';

export type CaptureKind = Knowledge['kind'];
export const KNOWLEDGE_CAPTURE_KINDS = ['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger'] as const;
export const CAPTURE_LABELS: Record<CaptureKind, string> = { cue: 'Cue', pattern: 'Pattern', heuristic: 'Heuristic', distinction: 'Distinction', exception: 'Exception', redFlag: 'Red flag', question: 'Diagnostic question', languageRule: 'Language rule', procedure: 'Procedure', case: 'Critical case', unknown: 'Question or gap', revisionTrigger: 'Revision trigger' };
export const captureFieldClass = 'mt-1 min-w-0 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950';
export const captureLines = (value: string) => value.split('\n').map((entry) => entry.trim()).filter(Boolean);
export const captureRefs = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean);

export function parseCaptureConditions(value: string): Condition[] {
  return captureLines(value).map((line) => {
    const match = /^(present|absent|equals):\s*(.+)$/.exec(line);
    if (!match && /^(present|absent|equals):/.test(line)) throw new Error('A condition needs a key after its operator.');
    if (!match) return { kind: 'context', key: line, operator: 'present' };
    if (match[1] !== 'equals') return { kind: 'context', key: match[2].trim(), operator: match[1] as 'present' | 'absent' };
    const split = match[2].indexOf('=');
    if (split < 1 || !match[2].slice(split + 1).trim()) throw new Error('An equality condition needs a key and value: equals:status=closed.');
    const raw = match[2].slice(split + 1).trim();
    const conditionValue = raw === 'true' ? true : raw === 'false' ? false : /^-?\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : raw;
    return { kind: 'context', key: match[2].slice(0, split).trim(), operator: 'equals', value: conditionValue };
  });
}

/** The browser sends content only; identity, provenance and review state come from the owner service. */
export function buildKnowledgeCaptureInput(kind: CaptureKind, readValue: (key: string) => string): Record<string, unknown> {
  const read = (key: string) => readValue(key).trim();
  const result: Record<string, unknown> = { kind, label: read('label'), scope: captureRefs(read('scope')), body: read('body') };
  if (!result.label || !result.body || !(result.scope as string[]).length) throw new Error('Name the lesson, its scope and the expert interpretation.');
  if (kind === 'distinction') result.terms = [read('conceptA'), read('conceptB')];
  if (['cue', 'pattern', 'heuristic', 'exception', 'redFlag', 'revisionTrigger'].includes(kind)) result.when = parseCaptureConditions(read('when'));
  if (['pattern', 'heuristic', 'procedure'].includes(kind)) result.exceptions = parseCaptureConditions(read('exceptions'));
  if (kind === 'languageRule') { result.language = read('language') || 'en'; result.implications = captureLines(read('implications')); result.avoidAlternatives = captureLines(read('avoidAlternatives')); if (read('speechAct')) result.speechAct = read('speechAct'); }
  if (['cue', 'redFlag', 'languageRule'].includes(kind)) result.nonImplications = captureLines(read('nonImplications'));
  if (kind === 'case') { result.situation = read('situation'); result.decision = read('decision'); result.analogyDimensions = captureLines(read('analogyDimensions')); if (read('outcome')) result.outcome = read('outcome'); }
  if (kind === 'exception') result.ruleRefs = captureRefs(read('ruleRefs'));
  if (kind === 'revisionTrigger') result.affectedIds = captureRefs(read('affectedIds'));
  if (kind === 'cue' && read('falsePositiveConditions')) result.falsePositiveConditions = parseCaptureConditions(read('falsePositiveConditions'));
  if (kind === 'procedure') {
    if (read('escalationConditions')) result.escalationConditions = parseCaptureConditions(read('escalationConditions'));
    if (read('inputs')) result.inputs = captureLines(read('inputs'));
    if (read('outputs')) result.outputs = captureLines(read('outputs'));
  }
  if (kind === 'case' && read('nonTransferableDimensions')) result.nonTransferableDimensions = captureLines(read('nonTransferableDimensions'));
  if (read('validFrom')) result.validFrom = read('validFrom');
  if (read('validUntil')) result.validUntil = read('validUntil');
  if (read('rationale')) result.rationale = read('rationale');
  if (read('sources')) result.sourceRefs = captureRefs(read('sources'));
  if (read('checks')) result.checks = captureLines(read('checks'));
  for (const [key, value] of Object.entries(result)) {
    if (Array.isArray(value) && value.length > 30) throw new Error(`${key} allows at most 30 entries per proposal.`);
  }
  return result;
}

export function CaptureField({ name, label, area = false, required = false, defaultValue, maxLength = 4000, placeholder }: {
  name: string; label: string; area?: boolean; required?: boolean; defaultValue?: string; maxLength?: number; placeholder?: string;
}) {
  const props = { name, required, maxLength, defaultValue, placeholder, className: captureFieldClass };
  return <label className="block min-w-0 text-xs font-semibold text-slate-700">{label}{area ? <textarea {...props} rows={3} /> : <input {...props} />}</label>;
}

const prompts: Record<CaptureKind, string> = {
  cue: 'What first catches your attention, and what should never be inferred from that clue alone?',
  pattern: 'Which combination of clues changes your interpretation? What would disconfirm the pattern?',
  heuristic: 'What would a beginner miss? When would you NOT apply this rule?',
  distinction: 'Which two concepts does a beginner confuse? What evidence separates them?',
  exception: 'Which rule fails in this situation, and what must be checked before making an exception?',
  redFlag: 'What makes you pause? Record possible significance and the evidence needed before drawing a conclusion.',
  question: 'Which question would change the decision? What evidence could resolve it?',
  languageRule: 'Which words carry institutional meaning? What should never be inferred from them?',
  procedure: 'What steps should another analyst follow, and when must they stop?',
  case: 'What first caught your attention? What did you do next, and where does the analogy fail?',
  unknown: 'What remains unknown or outside the available evidence? What would resolve it?',
  revisionTrigger: 'What change would make saved knowledge unreliable? Which items must be revisited?',
};

export function KnowledgeCaptureFields({ kind }: { kind: CaptureKind }) {
  const conditionLabels: Partial<Record<CaptureKind, string>> = { cue: 'Relevant only when', pattern: 'Expected cues', heuristic: 'Apply only when (condition keys, one per line)', exception: 'Exception applies when', redFlag: 'Relevant only when', revisionTrigger: 'Revisit when' };
  const checkLabels: Record<CaptureKind, string> = { cue: 'Follow-up checks', pattern: 'Recommended checks', heuristic: 'Checks before reuse (one per line)', distinction: 'Decision tests', exception: 'Required checks', redFlag: 'Evidence to request next', question: 'Evidence needed to answer', languageRule: 'Checks before reuse (one per line)', procedure: 'Ordered steps (one instruction per line)', case: 'Lessons from this case', unknown: 'Evidence needed to close the gap', revisionTrigger: 'Checks before reuse (one per line)' };
  return <div className="min-w-0 space-y-3" data-testid={`capture-fields-${kind}`}>
    <p className="text-sm font-medium text-slate-900">{prompts[kind]}</p>
    <CaptureField name="label" label={kind === 'languageRule' ? 'Exact expression' : kind === 'question' ? 'Diagnostic question' : 'Lesson title'} required maxLength={240} />
    <CaptureField name="scope" label="Scope (domains, separated by commas)" required maxLength={1000} placeholder="diplomacy, budget analysis" />
    {kind === 'distinction' ? <div className="grid min-w-0 gap-3 sm:grid-cols-2"><CaptureField name="conceptA" label="First concept" required /><CaptureField name="conceptB" label="Second concept" required /></div> : null}
    {kind === 'case' ? <CaptureField name="situation" label="Situation and what you noticed" required area /> : null}
    <CaptureField name="body" label={kind === 'languageRule' ? 'Meaning in this context' : kind === 'procedure' ? 'Purpose of this procedure' : kind === 'revisionTrigger' ? 'Action when the trigger occurs' : 'Expert interpretation or corrected explanation'} required area />
    {conditionLabels[kind] ? <CaptureField name="when" label={conditionLabels[kind]!} required={['heuristic', 'exception', 'revisionTrigger'].includes(kind)} area placeholder="present:technical-contact\nabsent:payment-record\nequals:status=closed" /> : null}
    {['pattern', 'heuristic', 'procedure'].includes(kind) ? <CaptureField name="exceptions" label={kind === 'pattern' ? 'Disconfirming cues (one per line)' : kind === 'procedure' ? 'Stop conditions (one per line)' : 'Exceptions (condition keys, one per line)'} area /> : null}
    {kind === 'cue' ? <CaptureField name="falsePositiveConditions" label="False-positive conditions (one per line)" area placeholder="present:routine-wording" /> : null}
    {kind === 'procedure' ? <><CaptureField name="escalationConditions" label="Escalate to a human when (one condition per line)" area /><div className="grid min-w-0 gap-3 sm:grid-cols-2"><CaptureField name="inputs" label="Required inputs (one per line)" area /><CaptureField name="outputs" label="Expected outputs (one per line)" area /></div></> : null}
    {conditionLabels[kind] || kind === 'procedure' ? <p className="text-xs text-slate-600">Conditions: one per line. Use present:key, absent:key, or equals:key=value. A bare key means present.</p> : null}
    {['cue', 'redFlag', 'languageRule'].includes(kind) ? <CaptureField name="nonImplications" label={kind === 'languageRule' ? 'What the wording does not establish (one per line)' : 'What must not be inferred (one per line)'} required area /> : null}
    {kind === 'languageRule' ? <><CaptureField name="language" label="Language" defaultValue="en" maxLength={40} /><CaptureField name="speechAct" label="Communicative act, if known" placeholder="conditional openness, request, commitment" /><CaptureField name="implications" label="What the wording suggests (one per line)" area /><CaptureField name="avoidAlternatives" label="Expressions that must not replace it (one per line)" area /></> : null}
    {kind === 'exception' ? <CaptureField name="ruleRefs" label="Rules this exception qualifies (IDs, comma separated)" /> : null}
    {kind === 'revisionTrigger' ? <CaptureField name="affectedIds" label="Knowledge or graph IDs to revisit (comma separated)" required /> : null}
    {kind === 'case' ? <><CaptureField name="decision" label="What you decided and why" required area /><CaptureField name="analogyDimensions" label="Where this case is analogous (one dimension per line)" required area /><CaptureField name="nonTransferableDimensions" label="Where this case must not transfer (one dimension per line)" area /><CaptureField name="outcome" label="Observed outcome, if known" area /></> : null}
    <CaptureField name="checks" label={checkLabels[kind]} required={kind === 'procedure'} area />
    <details><summary className="cursor-pointer text-xs font-semibold text-slate-700">Rationale, validity and attached evidence</summary><div className="mt-3 space-y-3"><CaptureField name="rationale" label="Why this lesson matters" area /><div className="grid min-w-0 gap-3 sm:grid-cols-2"><CaptureField name="validFrom" label="Valid from (ISO date, optional)" maxLength={40} placeholder="2026-10-03" /><CaptureField name="validUntil" label="Valid until (ISO date, optional)" maxLength={40} placeholder="2026-12-31" /></div><CaptureField name="sources" label="Attached source or evidence IDs (comma separated)" /><p className="text-xs text-slate-600">Use saved source or evidence IDs from this capsule. Missing anchors cannot become source-backed claims.</p></div></details>
  </div>;
}

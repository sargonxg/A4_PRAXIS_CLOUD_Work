import { z } from 'zod';

const Claim = z.object({ quote: z.string().max(3000), start: z.number().int().nonnegative(), end: z.number().int().nonnegative(), speaker: z.string().max(240), polarity: z.enum(['affirmative', 'negative', 'unknown']), modality: z.enum(['asserted', 'alleged', 'conditional', 'proposed', 'denied', 'unknown']), conditions: z.string().max(1000), accepted: z.boolean().default(false) }).strict();
const RecordSchema = z.object({ id: z.string().min(1).max(100), split: z.enum(['development', 'heldout']), country: z.string().regex(/^[A-Z]{2}$/), language: z.string().min(2).max(40), synthetic: z.boolean(), labelProvenance: z.enum(['human', 'synthetic']), sourceText: z.string().min(1).max(16000), expectedClaims: z.array(Claim).max(30), predictions: z.object({ keyword: z.array(Claim).max(30).optional(), rawModel: z.array(Claim).max(30).optional(), modelPlusContext: z.array(Claim).max(30).optional() }).strict().default({}) }).strict();
export const SignalEvaluationSchema = z.object({ schemaVersion: z.literal('signal-evaluation/1'), datasetVersion: z.string().min(1).max(100), records: z.array(RecordSchema).min(1).max(2000) }).strict().superRefine((data, ctx) => {
  const seen = new Set<string>();
  for (const [index, record] of data.records.entries()) {
    if (seen.has(record.id)) ctx.addIssue({ code: 'custom', path: ['records', index, 'id'], message: 'Duplicate record ID' });
    seen.add(record.id);
    if (record.synthetic && (record.labelProvenance === 'human' || record.split === 'heldout')) ctx.addIssue({ code: 'custom', path: ['records', index], message: 'Synthetic examples are development checks, never human gold or held-out evidence.' });
    if (!record.synthetic && record.labelProvenance !== 'human') ctx.addIssue({ code: 'custom', path: ['records', index], message: 'Non-synthetic evaluation requires human labels.' });
    for (const claim of record.expectedClaims) if (!literal(record.sourceText, claim)) ctx.addIssue({ code: 'custom', path: ['records', index, 'expectedClaims'], message: 'Gold quotation does not match its exact UTF-16 source span.' });
  }
});
type Claim = z.infer<typeof Claim>;
export type SignalEvaluationDataset = z.infer<typeof SignalEvaluationSchema>;
const lanes = ['keyword', 'rawModel', 'modelPlusContext'] as const;
function literal(text: string, claim: Claim) {
  const splitPair = (at: number) => at > 0 && /[\uD800-\uDBFF]/.test(text[at - 1]) && /[\uDC00-\uDFFF]/.test(text[at] ?? '');
  return claim.end > claim.start && claim.end <= text.length && text.slice(claim.start, claim.end) === claim.quote && !splitPair(claim.start) && !splitPair(claim.end);
}
const fields = ['speaker', 'polarity', 'modality', 'conditions'] as const;
function matched(expected: Claim[], claim: Claim) { return expected.find(e => e.start === claim.start && e.end === claim.end && e.quote === claim.quote); }
function correct(text: string, expected: Claim[], claim: Claim) { const e = matched(expected, claim); return Boolean(literal(text, claim) && e && fields.every(f => e[f] === claim[f])); }
function completeCorrect(text: string, expected: Claim[], predictions: Claim[]) {
  return predictions.length === expected.length && predictions.every(c => correct(text, expected, c)) && new Set(predictions.map(c => `${c.start}:${c.end}:${c.quote}`)).size === expected.length;
}
const ratio = (numerator: number, denominator: number) => ({ numerator, denominator, value: denominator ? numerator / denominator : null });

/** Literal first-sentence keyword baseline; it has no access to reference labels. */
export function signalKeywordBaseline(text: string): Claim[] {
  const quote = text.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0].trimEnd() ?? text.slice(0, 3000);
  const negative = /\b(not|não|no)\b/i.test(quote);
  const conditional = /\b(if|se|may|pode)\b/i.test(quote);
  return [{ quote, start: 0, end: quote.length, speaker: 'unknown', polarity: negative ? 'negative' : 'unknown', modality: conditional ? 'conditional' : 'unknown', conditions: '', accepted: false }];
}

export function evaluateSignal(raw: unknown) {
  const data = SignalEvaluationSchema.parse(raw);
  const evaluateSplit = (split: 'development' | 'heldout') => {
    const records = data.records.filter(r => r.split === split);
    const humanRecords = records.filter(r => r.labelProvenance === 'human' && !r.synthetic);
    const countries = new Set(humanRecords.map(r => r.country)); const languages = new Set(humanRecords.map(r => r.language));
    const sufficient = humanRecords.length >= 200 && countries.size >= 3 && languages.size >= 2;
    const metrics = Object.fromEntries(lanes.map(lane => {
      const present = records.filter(r => r.predictions[lane] !== undefined);
      if (!present.length) return [lane, { status: 'not_measured', reason: 'No predictions supplied for this lane.', recordCount: 0 }];
      let predicted = 0, expected = 0, spans = 0, exact = 0, fabricatedAccepted = 0;
      const fieldCorrect = { speaker: 0, polarity: 0, modality: 0, conditions: 0 }; let fieldDenominator = 0;
      const unknowns = { speaker: 0, polarity: 0, modality: 0 }; const errors: Array<{ recordId: string; predictionIndex: number; reason: string }> = [];
      for (const record of present) {
        const predictions = record.predictions[lane]!; predicted += predictions.length; expected += record.expectedClaims.length;
        const seenExact = new Set<number>();
        predictions.forEach((claim, predictionIndex) => {
          const valid = literal(record.sourceText, claim); if (valid) spans++; if (claim.accepted && !valid) fabricatedAccepted++;
          for (const f of ['speaker', 'polarity', 'modality'] as const) if (claim[f] === 'unknown') unknowns[f]++;
          const e = matched(record.expectedClaims, claim);
          if (valid && e) { fieldDenominator++; for (const f of fields) if (claim[f] === e[f]) fieldCorrect[f]++; }
          const goldIndex = e ? record.expectedClaims.indexOf(e) : -1;
          if (correct(record.sourceText, record.expectedClaims, claim) && !seenExact.has(goldIndex)) { exact++; seenExact.add(goldIndex); }
          else if (errors.length < 20) errors.push({ recordId: record.id, predictionIndex, reason: !valid ? 'fabricated_or_invalid_span' : !e ? 'unlabeled_claim' : seenExact.has(goldIndex) ? 'duplicate_prediction' : 'attribution_or_semantic_mismatch' });
        });
      }
      return [lane, { status: 'measured', recordCount: present.length, missingRecordCount: records.length - present.length, predictedClaims: predicted, expectedClaims: expected, exactSpanPrecision: ratio(spans, predicted), exactClaimPrecision: ratio(exact, predicted), exactClaimRecall: ratio(exact, expected), fieldAccuracyOnMatchedSpans: Object.fromEntries(fields.map(f => [f, ratio(fieldCorrect[f], fieldDenominator)])), unknowns, acceptedFabricatedQuotes: fabricatedAccepted, errors }];
    }));
    const paired = records.filter(r => r.predictions.rawModel !== undefined && r.predictions.modelPlusContext !== undefined);
    const regressions = paired.filter(r => completeCorrect(r.sourceText, r.expectedClaims, r.predictions.rawModel!) && !completeCorrect(r.sourceText, r.expectedClaims, r.predictions.modelPlusContext!));
    return { recordCount: records.length, humanGoldRecords: humanRecords.length, humanGoldCountries: [...countries].sort(), humanGoldLanguages: [...languages].sort(), benchmarkStatus: sufficient && split === 'heldout' ? 'sample_requirement_met' : 'not_measured', benchmarkReason: split === 'development' ? 'Development checks are not held-out analytical quality.' : sufficient ? 'Sample requirement met; prediction coverage and error rates still require inspection.' : 'Requires 200 human-labeled held-out records across at least three countries and two languages.', lanes: metrics, contextErrorRegression: { status: paired.length ? 'measured' : 'not_measured', pairedRecords: paired.length, addedErrorRecords: regressions.map(r => r.id), rate: ratio(regressions.length, paired.length) } };
  };
  return { schemaVersion: 'signal-evaluation-report/1', datasetVersion: data.datasetVersion, noLiveModelCalls: true, development: evaluateSplit('development'), heldout: evaluateSplit('heldout') };
}

export function signalDevelopmentExamples(): SignalEvaluationDataset {
  const rows = [
    { country: 'BR', language: 'pt', text: 'O ministro não adotou a proposta.', speaker: 'Ministro' },
    { country: 'SD', language: 'en', text: 'The minister did not adopt the proposal.', speaker: 'Minister' },
    { country: 'JP', language: 'en', text: 'The council did not adopt the proposal.', speaker: 'Council' },
  ];
  return SignalEvaluationSchema.parse({ schemaVersion: 'signal-evaluation/1', datasetVersion: 'synthetic-development/1', records: rows.map((r, i) => ({ id: `synthetic-${i + 1}`, split: 'development', country: r.country, language: r.language, synthetic: true, labelProvenance: 'synthetic', sourceText: r.text, expectedClaims: [{ quote: r.text, start: 0, end: r.text.length, speaker: r.speaker, polarity: 'negative', modality: 'denied', conditions: '', accepted: false }], predictions: { keyword: signalKeywordBaseline(r.text) } })) });
}

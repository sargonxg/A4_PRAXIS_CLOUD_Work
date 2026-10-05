import { describe, expect, it } from 'vitest';
import { evaluateSignal, signalDevelopmentExamples, SignalEvaluationSchema } from '@/lib/signal/evaluation';

describe('SIGNAL honest evaluation reports', () => {
  it('labels three-country two-language examples as synthetic development, with no held-out claims', () => {
    const report = evaluateSignal(signalDevelopmentExamples());
    expect(report.development.recordCount).toBe(3); expect(report.development.humanGoldRecords).toBe(0);
    expect(report.heldout.benchmarkStatus).toBe('not_measured'); expect(report.heldout.recordCount).toBe(0);
    expect(report.development.lanes.rawModel).toMatchObject({ status: 'not_measured' });
    expect(report.development.lanes.keyword).toMatchObject({ status: 'measured', recordCount: 3, exactSpanPrecision: { numerator: 3, denominator: 3, value: 1 }, exactClaimPrecision: { numerator: 0, denominator: 3, value: 0 } });
  });
  it('rejects synthetic material mislabeled as human gold or heldout', () => {
    const dataset = signalDevelopmentExamples(); dataset.records[0].labelProvenance = 'human'; expect(() => evaluateSignal(dataset)).toThrow('Synthetic');
    dataset.records[0].labelProvenance = 'synthetic'; dataset.records[0].split = 'heldout'; expect(() => evaluateSignal(dataset)).toThrow('held-out');
  });
  it('rejects fabricated gold spans and duplicate record identifiers', () => {
    const dataset = signalDevelopmentExamples(); dataset.records[0].expectedClaims[0].quote = 'Invented text'; expect(() => SignalEvaluationSchema.parse(dataset)).toThrow('Gold quotation');
    const duplicate = signalDevelopmentExamples(); duplicate.records[1].id = duplicate.records[0].id; expect(() => evaluateSignal(duplicate)).toThrow('Duplicate');
  });
  it('measures actual errors, accepted fabricated quotes, and context regressions on paired records', () => {
    const dataset = signalDevelopmentExamples(); const row = dataset.records[0];
    row.predictions.rawModel = structuredClone(row.expectedClaims);
    row.predictions.modelPlusContext = [{ ...row.expectedClaims[0], quote: 'The proposal was adopted.', accepted: true, polarity: 'affirmative', modality: 'asserted' }];
    const report = evaluateSignal(dataset);
    expect(report.development.lanes.rawModel).toMatchObject({ exactClaimPrecision: { numerator: 1, denominator: 1, value: 1 }, missingRecordCount: 2 });
    expect(report.development.lanes.modelPlusContext).toMatchObject({ acceptedFabricatedQuotes: 1, exactSpanPrecision: { numerator: 0, denominator: 1, value: 0 }, errors: [{ recordId: row.id, predictionIndex: 0, reason: 'fabricated_or_invalid_span' }] });
    expect(report.development.contextErrorRegression).toMatchObject({ status: 'measured', pairedRecords: 1, addedErrorRecords: [row.id], rate: { numerator: 1, denominator: 1, value: 1 } });
  });
  it('distinguishes correct quotation from wrong attribution, modality and conditions', () => {
    const dataset = signalDevelopmentExamples(); const row = dataset.records[0];
    row.predictions.rawModel = [{ ...row.expectedClaims[0], speaker: 'unknown', modality: 'asserted', conditions: 'if approved' }];
    expect(evaluateSignal(dataset).development.lanes.rawModel).toMatchObject({ exactSpanPrecision: { value: 1 }, exactClaimPrecision: { value: 0 }, fieldAccuracyOnMatchedSpans: { speaker: { value: 0 }, polarity: { value: 1 }, modality: { value: 0 }, conditions: { value: 0 } }, unknowns: { speaker: 1 } });
  });
  it('does not inflate recall from repeated predictions and reports abstention with null precision', () => {
    const dataset = signalDevelopmentExamples(); const row = dataset.records[0]; row.predictions.rawModel = [structuredClone(row.expectedClaims[0]), structuredClone(row.expectedClaims[0])]; row.predictions.modelPlusContext = [];
    const report = evaluateSignal(dataset);
    expect(report.development.lanes.rawModel).toMatchObject({ exactClaimRecall: { numerator: 1, denominator: 1, value: 1 }, exactClaimPrecision: { denominator: 2, value: 0.5 } });
    expect(report.development.lanes.modelPlusContext).toMatchObject({ exactClaimPrecision: { numerator: 0, denominator: 0, value: null }, exactClaimRecall: { numerator: 0, denominator: 1, value: 0 } });
  });
  it('reports a real small held-out sample without claiming the 200-record benchmark', () => {
    const dataset = signalDevelopmentExamples(); const row = dataset.records[0]; row.synthetic = false; row.labelProvenance = 'human'; row.split = 'heldout';
    row.predictions.rawModel = structuredClone(row.expectedClaims);
    const report = evaluateSignal(dataset);
    expect(report.heldout.humanGoldRecords).toBe(1); expect(report.heldout.benchmarkStatus).toBe('not_measured');
    expect(report.heldout.lanes.rawModel).toMatchObject({ status: 'measured', recordCount: 1 });
  });
});

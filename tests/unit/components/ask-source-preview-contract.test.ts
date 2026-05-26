import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Ask source preview panel contract', () => {
  const source = readFileSync(join(process.cwd(), 'src/components/ask/AskStreamPanel.tsx'), 'utf8');
  const answerQualityStripSource = readFileSync(join(process.cwd(), 'src/components/ask/AnswerQualityStrip.tsx'), 'utf8');

  it('renders source locators, source receipt links, and extraction fallback labels', () => {
    expect(source).toContain('locatorLabel');
    expect(source).toContain('sourceReceiptHref');
    expect(source).toContain('extractionFallbackLabel');
    expect(source).toContain('Source receipt');
  });

  it('renders follow-up chips as composer actions', () => {
    expect(source).toContain('onFollowUp');
    expect(source).toContain('setPrompt(followUp)');
    expect(source).toContain('<button');
    expect(source).not.toContain('<span key={followUp}');
  });

  it('renders compact orchestration receipts from the Ask answer envelope', () => {
    expect(source).toContain('OrchestrationReceiptPanel');
    expect(source).toContain('ProofSummaryPanel');
    expect(source).toContain('PRAXIS read');
    expect(source).toContain('modelPolicyLabel');
    expect(source).toContain('orchestrationReceipt');
    expect(source).toContain('Agent run');
    expect(source).toContain('Tool router');
  });

  it('renders the Ask turn plan as a simple in-thread plan before detailed receipts', () => {
    expect(source).toContain('AskTurnPlanPanel');
    expect(source).toContain('turnPlan');
    expect(source).toContain('PRAXIS plan');
    expect(source).toContain('statusRail');
    expect(source).toContain('artifactPlan');
    expect(source).toContain('continuationPolicy');
    expect(source.indexOf('<AskTurnPlanPanel')).toBeLessThan(source.indexOf('<AnswerQualityStrip'));
  });

  it('renders a compact answer-quality strip before detailed receipts', () => {
    expect(source).toContain('AnswerQualityStrip');
    expect(answerQualityStripSource).toContain('answerQualitySummary');
    expect(answerQualityStripSource).toContain('agenticDepthRecommendation');
    expect(answerQualityStripSource).toContain('contextRepairActions');
    expect(answerQualityStripSource).toContain('contextDiagnostics');
    expect(answerQualityStripSource).toContain('How PRAXIS used context');
    expect(source.indexOf('AnswerQualityStrip')).toBeLessThan(source.indexOf('OrchestrationReceiptPanel'));
  });

  it('renders the capsule grounding receipt and human review actions from the answer envelope', () => {
    expect(source).toContain('CapsuleGroundingReceiptPanel');
    expect(source).toContain('groundingReceipt');
    expect(source).toContain('Claim ledger');
    expect(source).toContain('Memory');
    expect(source).toContain('Promote supported claim');
    expect(source).toContain('Create source gap');
    expect(source).toContain('Create output capsule');
  });

  it('shows TACITUS routing stages without a normal model picker', () => {
    expect(source).toContain('Reading capsule');
    expect(source).toContain('Checking evidence');
    expect(source).toContain('Reviewing claims');
    expect(source).toContain('Saving artifact');
    expect(source).toContain('TACITUS routing');
    expect(source).not.toContain('aria-label="Ask PRAXIS model"');
    expect(source).not.toContain('setSelectedModel');
    expect(source).not.toContain('const model = stringValue(runtime.model)');
    expect(source).not.toContain('const model = runtime.model');
  });
});

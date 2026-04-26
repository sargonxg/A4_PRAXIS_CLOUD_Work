import { describe, it, expect } from 'vitest';
import {
  ClarifyingQuestionSchema,
  ClarificationRequestSchema,
  ClarifyingAnswersBundleSchema,
  isClarificationResponse,
  clarificationResponse,
  answersToPromptBlock,
} from '@/lib/agents/clarifying-questions';

const validQuestion = {
  id: 'actors',
  prompt: 'Which actors should I score?',
  inputType: 'long-text' as const,
  required: true,
  topic: 'scope' as const,
};

const validRequest = {
  toolId: 'risk-monitor',
  reason: 'I need actors before I can score risk.',
  questions: [validQuestion],
  resumeRoute: '/api/ai/risk-assessment',
};

describe('ClarifyingQuestionSchema', () => {
  it('accepts a well-formed question', () => {
    expect(ClarifyingQuestionSchema.safeParse(validQuestion).success).toBe(true);
  });

  it('requires id and prompt', () => {
    expect(ClarifyingQuestionSchema.safeParse({ ...validQuestion, id: '' }).success).toBe(false);
    expect(ClarifyingQuestionSchema.safeParse({ ...validQuestion, prompt: 'short' }).success).toBe(false);
  });

  it('rejects unsupported inputType', () => {
    expect(ClarifyingQuestionSchema.safeParse({ ...validQuestion, inputType: 'rgb-color' as never }).success).toBe(false);
  });

  it('rejects unknown topic', () => {
    expect(ClarifyingQuestionSchema.safeParse({ ...validQuestion, topic: 'mood' as never }).success).toBe(false);
  });

  it('defaults required to true and topic to scope', () => {
    const minimal = { id: 'q', prompt: 'a question we ask?', inputType: 'short-text' as const };
    const parsed = ClarifyingQuestionSchema.parse(minimal);
    expect(parsed.required).toBe(true);
    expect(parsed.topic).toBe('scope');
  });
});

describe('ClarificationRequestSchema', () => {
  it('accepts a valid request', () => {
    expect(ClarificationRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('rejects requests with zero questions', () => {
    expect(ClarificationRequestSchema.safeParse({ ...validRequest, questions: [] }).success).toBe(false);
  });

  it('caps questions at 5', () => {
    const six = Array(6).fill(validQuestion).map((q, i) => ({ ...q, id: `q${i}` }));
    expect(ClarificationRequestSchema.safeParse({ ...validRequest, questions: six }).success).toBe(false);
  });
});

describe('ClarifyingAnswersBundleSchema', () => {
  it('accepts a valid bundle of answers', () => {
    const bundle = {
      toolId: 'risk-monitor',
      answers: [
        { questionId: 'actors', value: 'Government, AFN' },
        { questionId: 'attribution', value: true },
        { questionId: 'lenses', value: ['security', 'humanitarian'] },
      ],
    };
    expect(ClarifyingAnswersBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it('rejects bundles with no answers', () => {
    expect(ClarifyingAnswersBundleSchema.safeParse({ toolId: 'x', answers: [] }).success).toBe(false);
  });
});

describe('isClarificationResponse', () => {
  it('recognises a clarification payload', () => {
    expect(isClarificationResponse({ status: 'clarification-needed', clarification: validRequest })).toBe(true);
  });

  it('rejects normal payloads', () => {
    expect(isClarificationResponse({ status: 'ok' })).toBe(false);
    expect(isClarificationResponse(null)).toBe(false);
    expect(isClarificationResponse('string')).toBe(false);
  });
});

describe('clarificationResponse', () => {
  it('returns HTTP 200 with discriminator body', async () => {
    const r = clarificationResponse(validRequest);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.status).toBe('clarification-needed');
    expect(body.clarification.toolId).toBe('risk-monitor');
  });

  it('throws when the request is malformed', () => {
    expect(() =>
      clarificationResponse({ ...validRequest, questions: [] } as unknown as Parameters<typeof clarificationResponse>[0])
    ).toThrow();
  });
});

describe('answersToPromptBlock', () => {
  it('formats answers as a prompt-friendly section', () => {
    const block = answersToPromptBlock({
      toolId: 'risk-monitor',
      answers: [
        { questionId: 'actors', value: 'Government' },
        { questionId: 'lenses', value: ['security', 'humanitarian'] },
        { questionId: 'attribution', value: true },
      ],
    });
    expect(block).toMatch(/## ANALYST ANSWERS TO CLARIFYING QUESTIONS/);
    expect(block).toMatch(/- actors: Government/);
    expect(block).toMatch(/- lenses: security, humanitarian/);
    expect(block).toMatch(/- attribution: true/);
  });
});

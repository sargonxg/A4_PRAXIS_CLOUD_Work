import { describe, expect, it } from 'vitest';
import { describeAskFailure, parseDataStreamError } from '@/lib/ai/tasklet-stream';

describe('Tasklet stream error parsing', () => {
  it('extracts AI SDK object-shaped error chunks', () => {
    expect(parseDataStreamError('3:{"error":"model unavailable"}')).toBe('model unavailable');
    expect(parseDataStreamError('3:{"message":"capsule resolver timed out"}')).toBe('capsule resolver timed out');
  });

  it('extracts string error chunks and keeps malformed chunks useful', () => {
    expect(parseDataStreamError('3:"quota exceeded"')).toBe('quota exceeded');
    expect(parseDataStreamError('3:{bad json')).toBe('Ask PRAXIS stream failed.');
    expect(parseDataStreamError('0:"not an error"')).toBeNull();
  });

  it('classifies capsule-context failures distinctly', () => {
    expect(describeAskFailure('412 capsule_context_required')).toContain('active ContextCapsule');
  });
});

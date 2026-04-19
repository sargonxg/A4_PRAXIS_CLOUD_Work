import { describe, it, expect } from 'vitest';
import { scoreRouteSource } from '../../../scripts/audit-tools';

const EXAMPLE_BAD = `
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
export const POST = withAuth(async (req, user) => {
  await checkAndDeductCredits('ai_chat', 'chat');
  const { text } = await generateText({ model, prompt: 'hi' });
  return Response.json({ text });
});
`;

const EXAMPLE_GOOD = `
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { SituationKnowledgeCore } from '@/lib/knowledge';
import { generateText, Output } from 'ai';
export const POST = withCalibration('risk-monitor', 'ai_risk_assessment')(async (req, { uid, calibration }) => {
  const { situationId } = await req.json();
  const profile = calibration.toolContext.profile;
  const situation = calibration.toolContext.situation;
  const lang = calibration.outputConstraints.language;
  const tone = calibration.outputConstraints.audienceTone;
  const skc = new SituationKnowledgeCore(uid, situationId);
  const { object } = await generateText({
    model: getProModel(),
    prompt: calibration.systemPromptBlock + '\\n\\nAssess risk.',
    experimental_output: Output.object({ schema: Schema }),
  });
  await saveToolOutput({ uid, situationId, toolId: 'risk-monitor', profileVersion: calibration.provenance.profileVersion, output: object });
  return Response.json({ object });
});
`;

describe('scoreRouteSource', () => {
  it('scores a bad route low', () => {
    const s = scoreRouteSource('risk-monitor', EXAMPLE_BAD);
    expect(s.score).toBeLessThan(4);
    expect(s.dimensions.withCalibration).toBe(false);
    expect(s.dimensions.saveToolOutput).toBe(false);
  });
  it('scores a good route 11/11', () => {
    const s = scoreRouteSource('risk-monitor', EXAMPLE_GOOD);
    expect(s.dimensions.withCalibration).toBe(true);
    expect(s.dimensions.saveToolOutput).toBe(true);
    expect(s.dimensions.profileVersionStamp).toBe(true);
    expect(s.dimensions.zodSchema).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(8);
  });
});

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('/api/ai/chat active context contract', () => {
  const chatRouteSource = readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8');
  const withCalibrationSource = readFileSync(join(process.cwd(), 'src/lib/api/with-calibration.ts'), 'utf8');
  const profileContextSource = readFileSync(join(process.cwd(), 'src/lib/context/profile-context.ts'), 'utf8');
  const systemPromptBlockSource = readFileSync(join(process.cwd(), 'src/lib/context/system-prompt-block.ts'), 'utf8');
  const praxisChatSource = readFileSync(join(process.cwd(), 'src/components/app/praxis-chat.tsx'), 'utf8');

  it('keeps the active context stack on the client request and server calibration path', () => {
    expect(praxisChatSource).toContain('activeContextStack: askStack');
    expect(chatRouteSource).toContain('activeContextStack: z.unknown().optional()');
    expect(chatRouteSource).toContain('activeContextStack,');
    expect(chatRouteSource).toContain('buildEnrichedTurnCapsule');
    expect(chatRouteSource).toContain('activeContextStack: isRecord(activeContextStack)');
    expect(withCalibrationSource).toContain('activeContextStack');
    expect(withCalibrationSource).toContain('buildCalibratedContext');
    expect(profileContextSource).toContain('loadAttachedCapsules');
    expect(profileContextSource).toContain('capsuleFrames: attachedCapsules.map(capsuleToPromptFrame)');
  });

  it('emits rich capsule-frame content for attached capsules', () => {
    expect(systemPromptBlockSource).toContain('<capsule-frame count="');
    expect(systemPromptBlockSource).toContain('ontology: domain=');
    expect(systemPromptBlockSource).toContain('top_claims:');
    expect(systemPromptBlockSource).toContain('receipts:');
    expect(systemPromptBlockSource).toContain('validity: asOf=');
    expect(systemPromptBlockSource).toContain('agent_contract:');
    expect(systemPromptBlockSource).toContain('allowed_actions:');
    expect(systemPromptBlockSource).toContain('source_requirements:');
    expect(systemPromptBlockSource).toContain('stop_conditions:');
  });
});

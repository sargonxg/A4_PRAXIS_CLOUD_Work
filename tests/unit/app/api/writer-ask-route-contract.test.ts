import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(join(process.cwd(), 'src/app/api/ai/writer/ask/route.ts'), 'utf8');
const memoDeskSource = readFileSync(join(process.cwd(), 'src/components/memo/memo-desk.tsx'), 'utf8');

describe('writer Ask memo check route contract', () => {
  it('keeps claim and language checks on the calibrated writer route', () => {
    expect(routeSource).toContain("withCalibration('policy-memo', 'ai_chat'");
    expect(routeSource).toContain('delegateToAskPraxis');
    expect(routeSource).toContain('saveToolOutput');
    expect(routeSource).toContain("toolId: 'policy-memo:claim-check'");
    expect(routeSource).toContain("toolId: 'policy-memo:language-check'");
  });

  it('carries active capsule provenance through memo checks', () => {
    expect(memoDeskSource).toContain('capsuleId: activeCapsule?.capsuleId');
    expect(routeSource).toContain('capsuleId: z.string().max(200).optional()');
    expect(routeSource).toContain('buildMemoClaimCheckQuestion');
    expect(routeSource).toContain('capsuleId: parsed.data.capsuleId ?? null');
  });

  it('blocks memo exports behind the combined export-ready gate', () => {
    expect(memoDeskSource).toContain('deriveMemoExportGate');
    expect(memoDeskSource).toContain('classificationMarking');
    expect(memoDeskSource).toContain('memoExportGate.ready');
    expect(memoDeskSource).toContain('Export blocked');
    expect(memoDeskSource).toContain('Sourceability');
    expect(memoDeskSource).toContain('Red-line');
    expect(memoDeskSource).toContain('Classification');
  });
});

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('backend capsule/v2 Pydantic mirror', () => {
  it('defines the ADR 0050 capsule fields for FastAPI/backend validation', () => {
    const mirrorPath = path.join(process.cwd(), 'backend', 'types', 'context_capsule.py');
    const source = readFileSync(mirrorPath, 'utf8');

    expect(source).toContain('schema_version: Literal["capsule/v2"]');
    expect(source).toContain('class CapsuleImport');
    expect(source).toContain('class SourcingPolicy');
    expect(source).toContain('class RetrievalConfig');
    expect(source).toContain('class CapsuleEval');
    expect(source).toContain('class MarketMetadata');
  });
});

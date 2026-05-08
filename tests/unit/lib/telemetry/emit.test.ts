import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitTelemetry, TELEMETRY_DETAILS_MAX_BYTES } from '@/lib/telemetry/emit';

describe('emitTelemetry', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits schema-versioned JSON lines', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const emitted = emitTelemetry({
      eventName: 'case.create',
      uid: 'user-1',
      orgId: 'org-1',
      caseId: 'case-1',
      route: '/api/situations',
      details: { source: 'unit' },
    });

    expect(emitted.schemaVersion).toBe(1);
    expect(emitted.eventName).toBe('case.create');
    const line = JSON.parse(log.mock.calls[0]?.[0] as string);
    expect(line.telemetry.uid).toBe('user-1');
    expect(line.telemetry.details.source).toBe('unit');
  });

  it('rejects details larger than the 1KB PII cap', () => {
    expect(() =>
      emitTelemetry({
        eventName: 'case.create',
        uid: 'user-1',
        details: { text: 'x'.repeat(TELEMETRY_DETAILS_MAX_BYTES + 1) },
      }),
    ).toThrow(/Telemetry details exceed/);
  });
});

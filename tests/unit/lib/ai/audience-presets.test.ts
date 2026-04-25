import { describe, expect, it } from 'vitest';
import { audienceTonePreset, audienceTuningEnabled } from '@/lib/ai/audience-presets';

describe('audienceTonePreset', () => {
  it('returns the senior_leadership preset with BLUF guidance', () => {
    const out = audienceTonePreset('senior_leadership');
    expect(out).toContain('SENIOR LEADERSHIP');
    expect(out.toLowerCase()).toContain('bottom-line-up-front');
  });

  it('returns the public preset with plain-language guidance', () => {
    const out = audienceTonePreset('public');
    expect(out).toContain('PUBLIC');
    expect(out.toLowerCase()).toContain('plain language');
  });

  it('returns the team preset with action-oriented guidance', () => {
    const out = audienceTonePreset('team');
    expect(out).toContain('PEER TEAM');
    expect(out.toLowerCase()).toContain('action-oriented');
  });

  it('returns the external_partners preset with diplomatic register', () => {
    const out = audienceTonePreset('external_partners');
    expect(out).toContain('EXTERNAL PARTNERS');
    expect(out.toLowerCase()).toContain('diplomatic register');
  });

  it('returns the myself preset with terse guidance', () => {
    const out = audienceTonePreset('myself');
    expect(out).toContain('SELF-NOTES');
    expect(out.toLowerCase()).toContain('terse');
  });

  it('falls back to "myself" preset for undefined input', () => {
    expect(audienceTonePreset(undefined)).toBe(audienceTonePreset('myself'));
  });

  it('falls back to "myself" preset for null input', () => {
    expect(audienceTonePreset(null)).toBe(audienceTonePreset('myself'));
  });
});

describe('audienceTuningEnabled', () => {
  it('returns false when env var is unset', () => {
    delete process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING;
    expect(audienceTuningEnabled()).toBe(false);
  });

  it('returns true when env var is "1"', () => {
    process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING = '1';
    expect(audienceTuningEnabled()).toBe(true);
    delete process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING;
  });

  it('returns false for any other value', () => {
    process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING = 'true';
    expect(audienceTuningEnabled()).toBe(false);
    delete process.env.PRAXIS_AUDIENCE_TUNED_BRIEFING;
  });
});

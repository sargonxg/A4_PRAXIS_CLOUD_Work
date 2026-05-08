import { afterEach, describe, expect, it } from 'vitest';
import { getCronSecretFromRequest, isCronAuthorized, requireCronSecret } from '@/lib/api/cron-auth';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

afterEach(() => {
  process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('cron auth', () => {
  it('accepts the x-cron-secret header', () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const req = new Request('http://localhost/api/cron/test', {
      headers: { 'x-cron-secret': 'cron-test-secret' },
    });

    expect(getCronSecretFromRequest(req)).toBe('cron-test-secret');
    expect(isCronAuthorized(req)).toBe(true);
    expect(requireCronSecret(req)).toBeNull();
  });

  it('accepts bearer authorization for Cloud Scheduler compatibility', () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const req = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer cron-test-secret' },
    });

    expect(getCronSecretFromRequest(req)).toBe('cron-test-secret');
    expect(isCronAuthorized(req)).toBe(true);
  });

  it('rejects missing or mismatched secrets', async () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const res = requireCronSecret(new Request('http://localhost/api/cron/test'));

    expect(res?.status).toBe(401);
    await expect(res?.json()).resolves.toMatchObject({ error: 'unauthorized' });
  });
});

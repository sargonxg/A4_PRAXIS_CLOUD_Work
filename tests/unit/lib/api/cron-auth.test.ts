import { afterEach, describe, expect, it } from 'vitest';
import { getCronSecretFromRequest, isCronAuthorized, requireCronSecret } from '@/lib/api/cron-auth';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

afterEach(() => {
  process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('cron auth', () => {
  function requestWithCronHeader(value: string): Request {
    return {
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-cron-secret' ? value : null),
      },
    } as unknown as Request;
  }

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

  it('accepts a clean header when the env secret has a trailing newline', () => {
    process.env.CRON_SECRET = 'cron-test-secret\n';
    const req = new Request('http://localhost/api/cron/test', {
      headers: { 'x-cron-secret': 'cron-test-secret' },
    });

    expect(isCronAuthorized(req)).toBe(true);
  });

  it('accepts a padded header when the env secret is clean', () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const req = requestWithCronHeader('  cron-test-secret  ');

    expect(isCronAuthorized(req)).toBe(true);
  });

  it('rejects all requests when the env secret is empty after trimming', () => {
    const req = new Request('http://localhost/api/cron/test', {
      headers: { 'x-cron-secret': 'cron-test-secret' },
    });

    process.env.CRON_SECRET = '';
    expect(isCronAuthorized(req)).toBe(false);

    process.env.CRON_SECRET = ' \n\t ';
    expect(isCronAuthorized(req)).toBe(false);
  });

  it('rejects missing or mismatched secrets', async () => {
    process.env.CRON_SECRET = 'cron-test-secret';
    const missingSecret = new Request('http://localhost/api/cron/test');
    const wrongSecret = new Request('http://localhost/api/cron/test', {
      headers: { 'x-cron-secret': 'wrong-secret' },
    });
    const res = requireCronSecret(missingSecret);
    const wrongSecretRes = requireCronSecret(wrongSecret);

    expect(isCronAuthorized(wrongSecret)).toBe(false);
    expect(res?.status).toBe(401);
    expect(wrongSecretRes?.status).toBe(401);
    await expect(res?.json()).resolves.toMatchObject({ error: 'unauthorized' });
    await expect(wrongSecretRes?.json()).resolves.toMatchObject({ error: 'unauthorized' });
  });
});

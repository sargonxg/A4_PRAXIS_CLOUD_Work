import { describe, it, expect, beforeAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  buildAad,
  encrypt,
  decrypt,
  maskSecret,
  __resetMasterKeyCacheForTests,
} from './envelope';

beforeAll(() => {
  // Deterministic test key — NEVER use in prod.
  process.env.USER_KEY_MASTER = randomBytes(32).toString('base64');
  __resetMasterKeyCacheForTests();
});

describe('envelope crypto', () => {
  it('round-trips a plaintext under matching AAD', () => {
    const aad = buildAad('uid-alice', 'google_ai');
    const rec = encrypt('tvly-secret-1234', aad);
    const pt = decrypt(rec, aad);
    expect(pt).toBe('tvly-secret-1234');
  });

  it('produces a fresh IV per call (two encryptions of the same plaintext differ)', () => {
    const aad = buildAad('uid-alice', 'google_ai');
    const a = encrypt('same-plain', aad);
    const b = encrypt('same-plain', aad);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(a.tag).not.toBe(b.tag);
  });

  it('rejects decryption when AAD does not match', () => {
    const aad = buildAad('uid-alice', 'google_ai');
    const rec = encrypt('secret', aad);
    const wrong = buildAad('uid-alice', 'grounded_search');
    expect(() => decrypt(rec, wrong)).toThrow(/AAD mismatch/);
  });

  it('rejects tampered ciphertext', () => {
    const aad = buildAad('uid-alice', 'google_ai');
    const rec = encrypt('secret', aad);
    const tampered = { ...rec, ciphertext: Buffer.from('tampered').toString('base64') };
    expect(() => decrypt(tampered, aad)).toThrow();
  });

  it('rejects version mismatches', () => {
    const aad = buildAad('uid-alice', 'google_ai');
    const rec = encrypt('secret', aad);
    const bad = { ...rec, v: 2 as unknown as 1 };
    expect(() => decrypt(bad, aad)).toThrow(/unsupported record version/);
  });

  it('rejects replay across providers for the same user', () => {
    const aadA = buildAad('uid-alice', 'google_ai');
    const aadB = buildAad('uid-alice', 'grounded_search');
    const rec = encrypt('secret', aadA);
    expect(() => decrypt(rec, aadB)).toThrow();
  });

  it('rejects replay across users for the same provider', () => {
    const aadA = buildAad('uid-alice', 'google_ai');
    const aadB = buildAad('uid-bob', 'google_ai');
    const rec = encrypt('secret', aadA);
    expect(() => decrypt(rec, aadB)).toThrow();
  });

  it('masks short and long secrets appropriately', () => {
    expect(maskSecret('')).toBe('');
    expect(maskSecret('abc')).toBe('********');
    expect(maskSecret('AIza12345678XYZ')).toBe('AIza…78XYZ'.replace('78', '8XY').slice(0, 'AIza…78XYZ'.length));
    expect(maskSecret('AIzaSecretKey1234').startsWith('AIza')).toBe(true);
  });
});

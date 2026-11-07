import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditPublicCredentials } from './audit-public-credentials.mjs';

test('rejects a bound service-account key without disclosing its value', () => {
  const secret = ['AQ.', 'x'.repeat(48)].join('');
  const findings = auditPublicCredentials('cloudbuild.yaml', `PUBLIC_KEY=${secret}`);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 1);
  assert.equal(JSON.stringify(findings).includes(secret), false);
});

test('accepts a public reCAPTCHA site key and Firebase browser identifier', () => {
  assert.deepEqual(auditPublicCredentials('cloudbuild.yaml',
    "NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=6Lexample_public_site_key\nNEXT_PUBLIC_FIREBASE_API_KEY=AIza_example_public_browser_key"), []);
});

test('rejects an API key in the reCAPTCHA site-key field', () => {
  const findings = auditPublicCredentials('cloudbuild.yaml',
    'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=AIza_wrong_credential_type');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, 'recaptcha-site-key-type');
});

test('reports all occurrences with line numbers and accepts substitutions', () => {
  const secret = ['AQ.', 'y'.repeat(48)].join('');
  const findings = auditPublicCredentials('example.ts', `first\n${secret}\n${secret}`);
  assert.deepEqual(findings.map(f => f.line), [2, 3]);
  assert.deepEqual(auditPublicCredentials('cloudbuild.yaml',
    'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=${_RECAPTCHA_SITE_KEY}'), []);
});

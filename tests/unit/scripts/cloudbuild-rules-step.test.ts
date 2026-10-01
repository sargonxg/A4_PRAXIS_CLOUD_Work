import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const config = parse(readFileSync('cloudbuild.frontend.yaml', 'utf8')) as {
  steps: Array<{ id: string; args: string[]; waitFor: string[]; timeout?: string }>;
  substitutions: Record<string, string>;
};

describe('Cloud Build separate Firestore proof lane', () => {
  it('pins the approved source hash from this release and the dependency version', () => {
    const hash = createHash('sha256').update(readFileSync('firestore.rules', 'utf8').replace(/\r\n/g, '\n')).digest('hex');
    expect(config.substitutions._FIRESTORE_RULES_SHA256).toBe(hash);
    const step = config.steps.find(step => step.id === 'verify-publish-firestore-rules')!;
    expect(step.args.join('\n')).toContain('google-auth-library@10.6.2');
    expect(step.args.join('\n')).toContain('--only=firestore');
    expect(step.args.join('\n')).toContain('--expected-firestore-sha256=${_FIRESTORE_RULES_SHA256}');
    expect(step.timeout).toBe('360s');
  });
  it('runs only after preflights and emits a pending receipt without enabling account erasure or changing IAM', () => {
    const step = config.steps.find(step => step.id === 'verify-publish-firestore-rules')!;
    expect(step.waitFor).toEqual(['preflight-audit-routes', 'preflight-audit-gcp', 'get-backend-url']);
    expect(step.args.join('\n')).toContain('RULES_STATUS: pending');
    expect(step.args.join('\n')).toContain('FIREBASE_RULES_RECEIPT');
    expect(step.args.join('\n')).not.toContain('setIamPolicy');
    expect(config.steps.find(step => step.id === 'deploy-frontend')?.args.join('\n')).not.toContain('PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=true');
  });
  it('preserves operator settings while disabling experimental checkout and unproven erasure', () => {
    const args = config.steps.find(step => step.id === 'deploy-frontend')!.args;
    expect(args).toContain('--update-env-vars');
    expect(args).toContain('--update-secrets');
    expect(args).not.toContain('--set-env-vars');
    expect(args).not.toContain('--set-secrets');
    const env = args[args.indexOf('--update-env-vars') + 1];
    expect(env.split('|')).toContain('PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED=false');
    expect(env.split('|')).toContain('PRAXIS_ENABLE_PAID_CHECKOUT=false');
    const secrets = args[args.indexOf('--update-secrets') + 1];
    expect(secrets.split(',')).toContain('COOKIE_SIGNING_SECRET=praxis-cookie-secret:latest');
    expect(secrets.split(',')).toContain('SESSION_SECRET=praxis-cookie-secret:latest');
  });
});

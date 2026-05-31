import { describe, expect, it } from 'vitest';
import {
  REQUIRED_LEGAL_SLUGS,
  evaluateLaunchReadiness,
  redactSensitiveEvidence,
} from '../../../scripts/audit-launch-readiness';

describe('audit-launch-readiness', () => {
  it('locks the public legal launch surface', () => {
    expect(REQUIRED_LEGAL_SLUGS).toEqual([
      'privacy',
      'cookies',
      'gdpr',
      'data-processing',
      'terms',
      'security',
      'sub-processors',
      'data-retention',
    ]);
  });

  it('flags launch blockers for missing legal pages and unsafe public env names', () => {
    const result = evaluateLaunchReadiness({
      files: {
        'package.json': JSON.stringify({ scripts: {} }),
        'src/proxy.ts': "response.headers.set('X-Frame-Options', 'DENY');",
        'src/app/(landing)/layout.tsx': '',
        'src/app/api/settings/api-keys/route.ts': 'return NextResponse.json({ payload: "secret" });',
        'src/app/(landing)/page.tsx': 'process.env.NEXT_PUBLIC_PROVIDER_SECRET',
      },
      liveHeaderEvidence: null,
      now: new Date('2026-05-19T00:00:00.000Z'),
    });

    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('package.json missing audit:launch-readiness'),
        expect.stringContaining('missing legal page slug privacy'),
        expect.stringContaining('public navigation missing legal link /legal/privacy'),
        expect.stringContaining('unsafe public env name NEXT_PUBLIC_PROVIDER_SECRET'),
        expect.stringContaining('api key status route appears to expose payload/plaintext'),
      ]),
    );
  });

  it('passes the static launch contract when required surfaces are present', () => {
    const files: Record<string, string> = {
      'package.json': JSON.stringify({ scripts: { 'audit:launch-readiness': 'tsx scripts/audit-launch-readiness.ts' } }),
      'src/proxy.ts': [
        "'/'",
        "'/pricing'",
        "'/learn'",
        "'/guide'",
        "'/release-notes'",
        "'/changelog'",
        "'/api/health'",
        "'/api/health/:path*'",
        "'/legal/:path*'",
        "response.headers.set('Content-Security-Policy', 'default-src')",
        "response.headers.set('Strict-Transport-Security', 'max-age=63072000')",
        "response.headers.set('X-Frame-Options', 'DENY')",
        "response.headers.set('X-Content-Type-Options', 'nosniff')",
        "response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')",
        "response.headers.set('Permissions-Policy', 'camera=()')",
      ].join('\n'),
      'src/app/(landing)/layout.tsx': '/legal/privacy /legal/cookies /legal/gdpr /legal/data-processing /legal/terms /legal/security /legal/sub-processors /legal/data-retention',
      'src/app/legal/[slug]/page.tsx': 'generateStaticParams',
      'src/lib/legal/pages.ts': REQUIRED_LEGAL_SLUGS.map((slug) => `slug: '${slug}', pendingLegalReview: false`).join('\n'),
      'src/app/api/settings/api-keys/route.ts': 'listUserKeyStatuses; return NextResponse.json({ providers: PROVIDER_REGISTRY, statuses });',
      'src/app/api/health/route.ts': [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
      ].join('\n'),
      'SECURITY.md': 'Do not commit secrets. User API keys are encrypted. withCalibration. Incident Response.',
      'docs/COMPLIANCE.md': 'GDPR. Sub-processor inventory. Data Processing Agreement.',
    };

    const result = evaluateLaunchReadiness({
      files,
      liveHeaderEvidence: null,
      now: new Date('2026-05-19T00:00:00.000Z'),
    });

    expect(result.failures).toEqual([]);
  });

  it('redacts sensitive values before writing evidence', () => {
    const redacted = redactSensitiveEvidence('token=abc123 PRIVATE_KEY="secret" service@project.iam.gserviceaccount.com');
    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('service@project.iam.gserviceaccount.com');
    expect(redacted).toContain('[REDACTED]');
  });
});

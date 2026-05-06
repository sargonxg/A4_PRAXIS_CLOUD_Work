import { describe, expect, it } from 'vitest';
import {
  extractFirewallClaims,
  verifyFirewallClaim,
  withFirewall,
} from '@/lib/api/with-firewall';
import type { ClaimTrustRecord, ClaimTrustWriter } from '@/lib/firebase/claims-service';

describe('withFirewall', () => {
  it('extracts claim-like strings from structured tool output only', () => {
    const claims = extractFirewallClaims({
      summary: 'According to [ReliefWeb], cross-border assistance remains constrained by access fragmentation.',
      metadata: { title: 'short' },
      recommendations: [
        'Likely deconfliction gains depend on sustained liaison access and donor leverage.',
      ],
    });

    expect(claims).toHaveLength(2);
    expect(claims[0]).toContain('According to');
  });

  it('classifies sourced, inferred, and unverified claims deterministically', () => {
    expect(verifyFirewallClaim('According to [UCDP], incidents increased near the crossing.').status).toBe('source_grounded');
    expect(verifyFirewallClaim('The pattern likely indicates pressure before negotiations.').status).toBe('inferred');
    expect(verifyFirewallClaim('The governor will accept the package tomorrow.').status).toBe('unverified');
  });

  it('adds firewall metadata and persists claim Trust Scores for real users', async () => {
    const writes: ClaimTrustRecord[] = [];
    const writer: ClaimTrustWriter = {
      async setClaim(_uid, _situationId, _claimId, record) {
        writes.push(record);
      },
    };

    const res = await withFirewall({
      req: new Request('http://localhost/api/ai/test-tool'),
      response: Response.json({
        summary: 'According to [PRAXIS Graph], actor leverage is concentrated around border access.',
        recommendations: ['This likely requires a verification channel before public guarantees.'],
      }),
      user: { uid: 'u1', isDemo: false },
      situationId: 's1',
      toolId: 'test-tool',
      toolRunId: 'run1',
      writer,
    });
    const body = await res.json() as { firewall: { status: string; checkedClaims: number; persistedClaims: number } };

    expect(res.headers.get('X-Praxis-Firewall')).toBe('verified');
    expect(body.firewall.checkedClaims).toBe(2);
    expect(body.firewall.persistedClaims).toBe(2);
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({ uid: 'u1', situationId: 's1', emittedBy: 'test-tool' });
  });

  it('warns but does not persist demo-user unverified claims', async () => {
    const writer: ClaimTrustWriter = {
      async setClaim() {
        throw new Error('demo users should not persist');
      },
    };

    const res = await withFirewall({
      req: new Request('http://localhost/api/ai/test-tool'),
      response: Response.json({ claim: 'The outcome is certain and requires no citations.' }),
      user: { uid: 'demo-user-001', isDemo: true },
      situationId: 's1',
      toolId: 'test-tool',
      writer,
    });
    const body = await res.json() as { firewall: { status: string; persistedClaims: number; warnings: string[] } };

    expect(res.headers.get('X-Praxis-Firewall')).toBe('warn');
    expect(body.firewall.persistedClaims).toBe(0);
    expect(body.firewall.warnings[0]).toContain('unverified:');
  });
});

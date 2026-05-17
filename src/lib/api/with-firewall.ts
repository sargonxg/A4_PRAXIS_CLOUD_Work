import { persistClaimTrust, type ClaimTrustWriter } from '@/lib/firebase/claims-service';

type FirewallStatus = 'verified' | 'warn' | 'skipped';
type ClaimGrounding = 'source_grounded' | 'inferred' | 'unverified';

export interface FirewallClaimDecision {
  text: string;
  status: ClaimGrounding;
  trustScore: number;
  reasons: string[];
}

export interface FirewallReport {
  status: FirewallStatus;
  checkedClaims: number;
  persistedClaims: number;
  warnings: string[];
  claims: FirewallClaimDecision[];
}

export interface FirewallContext {
  req: Request;
  response: Response;
  user: { uid: string; isDemo?: boolean };
  situationId?: string;
  toolId: string;
  toolRunId?: string | null;
  writer?: ClaimTrustWriter;
}

const CLAIM_KEYS = new Set([
  'claim',
  'claims',
  'finding',
  'findings',
  'assessment',
  'analysis',
  'summary',
  'recommendation',
  'recommendations',
  'judgment',
  'verdict',
  'keyFindings',
]);

const SOURCE_MARKERS = [
  /\[[^\]]*(?:source|google\s+search|grounded\s+search|web|praxis\s+graph|receipt|citation)[^\]]*\]/i,
  /https?:\/\/\S+/i,
  /\b(?:according to|source receipt|provenance|cited by|reported by)\b/i,
];

const INFERENCE_MARKERS = [
  /\b(?:likely|may|might|could|suggests|indicates|appears|estimate|assess|inference|scenario|uncertain|gap)\b/i,
];

function stableUnique(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const text = item.replace(/\s+/g, ' ').trim();
    if (text.length < 24 || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

export function extractFirewallClaims(value: unknown, limit = 25): string[] {
  const found: string[] = [];

  function walk(node: unknown, keyHint?: string) {
    if (found.length >= limit * 2 || node == null) return;
    if (typeof node === 'string') {
      if (keyHint && CLAIM_KEYS.has(keyHint)) found.push(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, keyHint);
      return;
    }
    if (typeof node === 'object') {
      for (const [key, nested] of Object.entries(node as Record<string, unknown>)) {
        walk(nested, CLAIM_KEYS.has(key) ? key : keyHint);
      }
    }
  }

  walk(value);
  return stableUnique(found, limit);
}

export function verifyFirewallClaim(text: string): FirewallClaimDecision {
  const reasons: string[] = [];
  const sourceGrounded = SOURCE_MARKERS.some((pattern) => pattern.test(text));
  const inferred = INFERENCE_MARKERS.some((pattern) => pattern.test(text));

  if (sourceGrounded) reasons.push('source_marker_detected');
  if (inferred) reasons.push('uncertainty_language_detected');

  if (sourceGrounded) {
    return { text, status: 'source_grounded', trustScore: inferred ? 82 : 90, reasons };
  }
  if (inferred) {
    return { text, status: 'inferred', trustScore: 64, reasons };
  }
  return { text, status: 'unverified', trustScore: 38, reasons: ['missing_source_or_uncertainty_marker'] };
}

function shouldInspectJson(response: Response): boolean {
  if (response.status < 200 || response.status >= 300) return false;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) return false;
  return contentType.includes('application/json') || !contentType;
}

function attachFirewallHeaders(response: Response, report: FirewallReport): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Praxis-Firewall', report.status);
  headers.set('X-Praxis-Firewall-Claims', String(report.checkedClaims));
  headers.set('X-Praxis-Firewall-Warnings', String(report.warnings.length));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withFirewallHeaders(response: Response): Response {
  return attachFirewallHeaders(response, {
    status: 'skipped',
    checkedClaims: 0,
    persistedClaims: 0,
    warnings: [],
    claims: [],
  });
}

export async function withFirewall({
  req,
  response,
  user,
  situationId,
  toolId,
  toolRunId,
  writer,
}: FirewallContext): Promise<Response> {
  if (!shouldInspectJson(response)) {
    return attachFirewallHeaders(response, {
      status: 'skipped',
      checkedClaims: 0,
      persistedClaims: 0,
      warnings: [],
      claims: [],
    });
  }

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return attachFirewallHeaders(response, {
      status: 'skipped',
      checkedClaims: 0,
      persistedClaims: 0,
      warnings: ['json_parse_failed'],
      claims: [],
    });
  }

  const claims = extractFirewallClaims(payload).map(verifyFirewallClaim);
  const warnings = claims
    .filter((claim) => claim.status === 'unverified')
    .map((claim) => `unverified:${claim.text.slice(0, 96)}`);
  let persistedClaims = 0;

  if (!user.isDemo && user.uid && situationId) {
    for (const claim of claims) {
      const result = await persistClaimTrust({
        uid: user.uid,
        situationId,
        claim: {
          text: claim.text,
          trustScore: claim.trustScore,
          groundingStatus: claim.status,
          emittedBy: toolId,
          toolRunId: toolRunId ?? null,
          route: new URL(req.url).pathname,
          reasons: claim.reasons,
        },
      }, writer).catch((error: unknown) => ({
        persisted: false,
        reason: error instanceof Error ? error.message : String(error),
      }));
      if (result.persisted) persistedClaims += 1;
    }
  }

  const report: FirewallReport = {
    status: warnings.length > 0 ? 'warn' : 'verified',
    checkedClaims: claims.length,
    persistedClaims,
    warnings,
    claims,
  };

  const body =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? { ...(payload as Record<string, unknown>), firewall: report }
      : { data: payload, firewall: report };

  return attachFirewallHeaders(Response.json(body, { status: response.status, statusText: response.statusText }), report);
}

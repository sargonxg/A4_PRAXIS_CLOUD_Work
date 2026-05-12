#!/usr/bin/env tsx
/**
 * audit:owner-scoping-runtime - verify a real user B session cannot read a
 * user A situation through the public Next.js API.
 *
 * Required when PRAXIS_OWNER_SCOPING_TEST=true:
 * - PRAXIS_BASE_URL: deployed or local app origin
 * - TEST_OWNER_SCOPING_CASE_ID: a case known to belong to user A
 * - TEST_USER_B_COOKIE: full Cookie header for user B
 *
 * Expected catch: accidental shared/collaborator/global paths that return 200
 * with user A data to user B.
 */

import process from 'node:process';

async function main() {
  if (process.env.PRAXIS_OWNER_SCOPING_TEST !== 'true') {
    console.log('audit:owner-scoping-runtime skipped (runtime-proof; env opt-in required)');
    return;
  }
  const baseUrl = process.env.PRAXIS_BASE_URL;
  const caseId = process.env.TEST_OWNER_SCOPING_CASE_ID;
  const userBCookie = process.env.TEST_USER_B_COOKIE;
  const missing = [
    ['PRAXIS_BASE_URL', baseUrl],
    ['TEST_OWNER_SCOPING_CASE_ID', caseId],
    ['TEST_USER_B_COOKIE', userBCookie],
  ].filter(([, value]) => !value);
  if (missing.length > 0) {
    console.error(`audit:owner-scoping-runtime FAILED - missing ${missing.map(([key]) => key).join(', ')}`);
    process.exit(1);
  }

  const target = `${baseUrl!.replace(/\/+$/, '')}/api/situations/${encodeURIComponent(caseId!)}`;
  const res = await fetch(target, {
    headers: { Cookie: userBCookie! },
    signal: AbortSignal.timeout(8_000),
  });
  if (res.status === 200) {
    const body = await res.text().catch(() => '');
    console.error(`audit:owner-scoping-runtime FAILED - user B read user A case at ${target}: ${body.slice(0, 300)}`);
    process.exit(1);
  }
  if (![401, 403, 404].includes(res.status)) {
    console.error(`audit:owner-scoping-runtime FAILED - expected 401/403/404, got ${res.status}`);
    process.exit(1);
  }
  console.log(`audit:owner-scoping-runtime passed (runtime-proof; cross-user read blocked with ${res.status})`);
}

main().catch((err) => {
  console.error('audit:owner-scoping-runtime threw:', err);
  process.exit(2);
});

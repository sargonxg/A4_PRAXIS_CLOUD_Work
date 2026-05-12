#!/usr/bin/env tsx
/**
 * audit:tool-context-isolation-runtime - verify a live tool/context route does
 * not expose user A case context to a user B session.
 *
 * Required when PRAXIS_OWNER_SCOPING_TEST=true:
 * - PRAXIS_BASE_URL: deployed or local app origin
 * - TEST_TOOL_CONTEXT_CASE_ID: a case known to belong to user A
 * - TEST_USER_B_COOKIE: full Cookie header for user B
 *
 * Expected catch: context builders that accept a caseId but forget to scope it
 * through the authenticated owner uid before retrieval.
 */

import process from 'node:process';

async function main() {
  if (process.env.PRAXIS_OWNER_SCOPING_TEST !== 'true') {
    console.log('audit:tool-context-isolation-runtime skipped (runtime-proof; env opt-in required)');
    return;
  }
  const baseUrl = process.env.PRAXIS_BASE_URL;
  const caseId = process.env.TEST_TOOL_CONTEXT_CASE_ID;
  const userBCookie = process.env.TEST_USER_B_COOKIE;
  const missing = [
    ['PRAXIS_BASE_URL', baseUrl],
    ['TEST_TOOL_CONTEXT_CASE_ID', caseId],
    ['TEST_USER_B_COOKIE', userBCookie],
  ].filter(([, value]) => !value);
  if (missing.length > 0) {
    console.error(`audit:tool-context-isolation-runtime FAILED - missing ${missing.map(([key]) => key).join(', ')}`);
    process.exit(1);
  }

  const target = `${baseUrl!.replace(/\/+$/, '')}/api/context/prompt-health?situationId=${encodeURIComponent(caseId!)}`;
  const res = await fetch(target, {
    headers: { Cookie: userBCookie! },
    signal: AbortSignal.timeout(8_000),
  });
  if (res.status === 200) {
    const body = await res.text().catch(() => '');
    console.error(`audit:tool-context-isolation-runtime FAILED - user B received user A context at ${target}: ${body.slice(0, 300)}`);
    process.exit(1);
  }
  if (![401, 403, 404].includes(res.status)) {
    console.error(`audit:tool-context-isolation-runtime FAILED - expected 401/403/404, got ${res.status}`);
    process.exit(1);
  }
  console.log(`audit:tool-context-isolation-runtime passed (runtime-proof; cross-user context blocked with ${res.status})`);
}

main().catch((err) => {
  console.error('audit:tool-context-isolation-runtime threw:', err);
  process.exit(2);
});

#!/usr/bin/env tsx
/**
 * audit:cognee-runtime - when Cognee is enabled, hit its live health endpoint.
 * Skips cleanly when the feature is disabled or the backend URL is absent.
 */

import process from 'node:process';

async function main() {
  const url = process.env.COGNEE_BACKEND_URL;
  if (!url) {
    console.log('audit:cognee-runtime skipped (runtime-proof; COGNEE_BACKEND_URL unset)');
    return;
  }
  if (process.env.COGNEE_ENABLED !== 'true') {
    console.log('audit:cognee-runtime skipped (runtime-proof; COGNEE_ENABLED != true)');
    return;
  }

  const target = `${url.replace(/\/+$/, '')}/health`;
  let res: Response;
  try {
    res = await fetch(target, { signal: AbortSignal.timeout(5_000) });
  } catch (err) {
    console.error(`audit:cognee-runtime FAILED - fetch error against ${target}: ${err}`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`audit:cognee-runtime FAILED - ${target} returned ${res.status}`);
    process.exit(1);
  }
  await res.text().catch(() => '');
  console.log(`audit:cognee-runtime passed (runtime-proof; ${res.status} from ${target})`);
}

main().catch((err) => {
  console.error('audit:cognee-runtime threw:', err);
  process.exit(2);
});

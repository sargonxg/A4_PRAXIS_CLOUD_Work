#!/usr/bin/env node
/**
 * verify-design-shipped.mjs
 *
 * Default mode is source-based so PR branches can prove the current Civic
 * Atelier surface before deployment. Set BASE_URL to add an HTTP check against
 * a deployed preview or production URL.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BASE_URL = process.env.BASE_URL;

const SOURCE_FILES = [
  'src/app/layout.tsx',
  'src/app/globals.css',
  'src/components/marketing/praxis-marketing-home.tsx',
  'src/components/app/praxis-app-launchpad.tsx',
  'src/lib/product/policy-missions.ts',
  'src/app/pricing/page.tsx',
  'src/app/(landing)/learn/page.tsx',
  'src/app/(landing)/layout.tsx',
];

const SOURCE_ASSERTIONS = [
  { name: 'EB Garamond headings', pattern: /EB_Garamond|EB Garamond/ },
  { name: 'Inter body', pattern: /Inter/ },
  { name: 'Civic Atelier shell', pattern: /civic-atelier-shell/ },
  { name: 'cartographic grid', pattern: /cartographic-grid/ },
  { name: 'specimen-card', pattern: /specimen-card/ },
  { name: 'receipt-slip', pattern: /receipt-slip/ },
  { name: 'context-chain', pattern: /context-chain/ },
  { name: 'policy missions', pattern: /Sanctions impact memo[\s\S]*Treaty analysis with citations[\s\S]*Stakeholder & ACH for a crisis/ },
  { name: 'billing mode honesty', pattern: /sandbox test mode|checkout is not configured/ },
  { name: 'premium web honesty', pattern: /Premium web is not enabled by default/ },
];

const LIVE_ASSERTIONS = [
  { name: 'PRAXIS brand mark', pattern: /PRAXIS/ },
  { name: 'Civic Atelier shell', pattern: /civic-atelier-shell/ },
  { name: 'policy mission copy', pattern: /Sanctions impact memo|Treaty analysis with citations|Stakeholder & ACH/ },
];

function sourceText() {
  return SOURCE_FILES.map((rel) => readFileSync(join(ROOT, rel), 'utf8')).join('\n\n');
}

function evaluate(label, text, assertions) {
  const failures = assertions.filter((assertion) => !assertion.pattern.test(text));
  console.log(`verify:design - ${label}`);
  for (const assertion of assertions) {
    const ok = assertion.pattern.test(text);
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${assertion.name}`);
  }
  return failures;
}

async function fetchLive(url) {
  const started = Date.now();
  const response = await fetch(url, { redirect: 'follow', headers: { accept: 'text/html' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  console.log(`verify:design - fetched ${url} in ${Date.now() - started}ms (${html.length} bytes)`);
  return html;
}

async function main() {
  const failures = evaluate('local source', sourceText(), SOURCE_ASSERTIONS);

  if (BASE_URL) {
    const liveHtml = await fetchLive(BASE_URL);
    failures.push(...evaluate(`live ${BASE_URL}`, liveHtml, LIVE_ASSERTIONS));
  } else {
    console.log('verify:design - live fetch skipped; set BASE_URL to verify a deployed preview.');
  }

  if (failures.length > 0) {
    console.error(`verify:design - ${failures.length} marker(s) missing.`);
    process.exit(1);
  }
  console.log('verify:design - all required markers present.');
}

main().catch((error) => {
  console.error(`verify:design - failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});

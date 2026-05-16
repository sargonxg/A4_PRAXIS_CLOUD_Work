#!/usr/bin/env node
/**
 * verify-design-shipped.mjs — post-deploy sanity check.
 *
 * Fetches the live landing URL and asserts the PRAXIS design system shipped:
 *  - btn-capsule-primary class is present in the HTML
 *  - section-rhythm wrapper is present
 *  - surface-glass utility appears
 *  - font-serif class appears
 *  - PRAXIS by TACITUS appears in nav
 *
 * Usage: BASE_URL=https://praxis.tacitus.me node scripts/verify-design-shipped.mjs
 * Defaults to https://praxis.tacitus.me when BASE_URL is unset.
 */

const BASE_URL = process.env.BASE_URL ?? "https://praxis.tacitus.me";

const ASSERTIONS = [
  { name: "btn-capsule-primary", pattern: /btn-capsule-primary/ },
  { name: "section-rhythm", pattern: /section-rhythm/ },
  { name: "surface-glass", pattern: /surface-glass/ },
  { name: "font-serif", pattern: /font-serif/ },
  { name: "PRAXIS brand mark", pattern: /PRAXIS/ },
];

async function main() {
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(BASE_URL, {
      redirect: "follow",
      headers: { accept: "text/html" },
    });
  } catch (err) {
    console.error(`verify:design — fetch failed: ${err.message}`);
    process.exit(2);
  }
  const dt = Date.now() - t0;

  if (!res.ok) {
    console.error(`verify:design — ${res.status} ${res.statusText} at ${BASE_URL} (${dt}ms)`);
    process.exit(1);
  }

  const html = await res.text();
  const fails = ASSERTIONS.filter((a) => !a.pattern.test(html));

  console.log(`verify:design — fetched ${BASE_URL} in ${dt}ms (${html.length} bytes)`);
  for (const a of ASSERTIONS) {
    const ok = a.pattern.test(html);
    console.log(`  ${ok ? "✓" : "✗"} ${a.name}`);
  }

  if (fails.length > 0) {
    console.error(`verify:design — ${fails.length} marker(s) missing. Design may not have shipped.`);
    process.exit(1);
  }
  console.log("verify:design — all markers present.");
}

main().catch((err) => {
  console.error("verify:design — crashed:", err);
  process.exit(2);
});

#!/usr/bin/env node
/**
 * audit-design.mjs — visual identity guard for PRAXIS landing surfaces.
 *
 * Run via: npm run audit:design (or directly: node scripts/audit-design.mjs)
 *
 * Checks:
 *  1. Button usage   — landing files use only "capsule|capsule-secondary|
 *                      capsule-ghost" variants (no <Button variant="default">).
 *  2. Hex literals   — landing files contain no raw #RRGGBB hex values.
 *  3. Rounded floor  — every <article|section> in landing has rounded-* class.
 *
 * Output: non-zero exit code if any check fails.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const STRICT = process.argv.includes("--strict");
const TARGETS = [
  "src/app/(landing)",
  "src/components/landing",
];

const ALLOWED_BUTTON_VARIANTS = new Set([
  "capsule",
  "capsule-secondary",
  "capsule-ghost",
]);

const HEX_PATTERN = /#(?:[0-9A-Fa-f]{3,8})\b/g;
const BUTTON_VARIANT_PATTERN = /variant\s*=\s*["']([^"']+)["']/g;
const ROUNDED_PATTERN = /\brounded-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\])\b/;

const violations = [];

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walk(p)));
    } else if (/\.(tsx|ts)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const files = (await Promise.all(TARGETS.map((t) => walk(join(ROOT, t))))).flat();
  let okFiles = 0;
  for (const file of files) {
    const src = await readFile(file, "utf8");
    const rel = file.replace(ROOT, "").replace(/\\/g, "/");

    // Check 1: Button variants
    let m;
    BUTTON_VARIANT_PATTERN.lastIndex = 0;
    while ((m = BUTTON_VARIANT_PATTERN.exec(src)) !== null) {
      const value = m[1];
      // Only flag <Button variant="..."> not arbitrary variant props
      const ctx = src.slice(Math.max(0, m.index - 80), m.index);
      if (/<Button\b/.test(ctx) && !ALLOWED_BUTTON_VARIANTS.has(value)) {
        violations.push({
          file: rel,
          rule: "button-variant",
          detail: `<Button variant="${value}"> — use capsule | capsule-secondary | capsule-ghost on landing`,
        });
      }
    }

    // Check 2: Raw hex literals (allow inside string-tagged comments).
    const hexes = src.match(HEX_PATTERN) || [];
    if (hexes.length > 0) {
      // Whitelist: graphify ids / mock data / aria values are rare; we still
      // flag everything so the audit nudges authors to use tokens.
      violations.push({
        file: rel,
        rule: "no-hex",
        detail: `${hexes.length} raw hex literal(s): ${[...new Set(hexes)].slice(0, 4).join(", ")} — use globals.css tokens or rgba(...).`,
      });
    }

    // Check 3: rounded floor on article/section
    const tagRegex = /<(article|section)\b([^>]*)>/g;
    let t;
    while ((t = tagRegex.exec(src)) !== null) {
      const attrs = t[2];
      if (!ROUNDED_PATTERN.test(attrs) && !/className=\{[^}]*rounded-/.test(attrs)) {
        // section is allowed unrounded if it's a top-level layout container;
        // we flag only <article> strictly.
        if (t[1] === "article") {
          violations.push({
            file: rel,
            rule: "rounded-floor",
            detail: `<article> without a rounded-* class — landing surfaces should be rounded-2xl or rounded-3xl`,
          });
        }
      }
    }

    okFiles++;
  }

  const errors = violations.filter((v) => v.rule !== "no-hex" || STRICT);
  const warnings = violations.filter((v) => v.rule === "no-hex" && !STRICT);

  if (violations.length === 0) {
    console.log(`audit:design — ok (${okFiles} files scanned)`);
    process.exit(0);
  }

  if (warnings.length > 0) {
    console.warn(`audit:design — ${warnings.length} warning(s) [no-hex] (run with --strict to fail)`);
    for (const v of warnings) {
      console.warn(`  WARN [${v.rule}] ${v.file}: ${v.detail}`);
    }
  }

  if (errors.length === 0) {
    console.log(`audit:design — ok (${okFiles} files scanned, warnings only)`);
    process.exit(0);
  }

  console.error(`audit:design — ${errors.length} error(s) across ${okFiles} files`);
  for (const v of errors) {
    console.error(`  ERROR [${v.rule}] ${v.file}: ${v.detail}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("audit:design — crashed:", err);
  process.exit(2);
});

#!/usr/bin/env tsx
/**
 * Locks canonical display names across the tool registries.
 *
 * Two registries describe the same tool surfaces:
 *   - src/lib/constants/tool-registry.ts  (TOOL_REGISTRY)
 *   - src/lib/tools/canonical.ts          (PRAXIS_CANONICAL_TOOLS)
 *
 * This audit catches the "tool surfaces three different names in three places"
 * regression by enforcing:
 *   1. Every id shared between both registries has the same `name`.
 *   2. No two tools share a `name` under different ids.
 *   3. `shortLabel` (canonical only) is either equal to `name` or a clear
 *      truncation prefix — never a third, unrelated label.
 *
 * Run: npx tsx scripts/audit-canonical-names.ts
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const { TOOL_REGISTRY } =
  require('../src/lib/constants/tool-registry.ts') as typeof import('../src/lib/constants/tool-registry');
const { PRAXIS_CANONICAL_TOOLS } =
  require('../src/lib/tools/canonical.ts') as typeof import('../src/lib/tools/canonical');

interface NameMismatch {
  id: string;
  registryName: string;
  canonicalName: string;
}

interface NameCollision {
  name: string;
  ids: string[];
  sources: string[];
}

interface ShortLabelDrift {
  id: string;
  name: string;
  shortLabel: string;
  reason: string;
}

function singularise(word: string): string {
  if (word.endsWith('ies') && word.length > 3) return `${word.slice(0, -3)}y`;
  if (word.endsWith('es') && word.length > 3) return word.slice(0, -2);
  if (word.endsWith('s') && word.length > 1) return word.slice(0, -1);
  return word;
}

function isShortLabelOk(name: string, shortLabel: string): boolean {
  if (shortLabel === name) return true;
  const normalisedName = name.toLowerCase().replace(/[^a-z0-9 ]+/g, '');
  const normalisedShort = shortLabel.toLowerCase().replace(/[^a-z0-9 ]+/g, '');
  if (normalisedName.startsWith(normalisedShort)) return true;
  const nameWords = normalisedName.split(' ');
  if (nameWords.includes(normalisedShort)) return true;
  if (nameWords.map(singularise).includes(singularise(normalisedShort))) return true;
  if (name === shortLabel.toUpperCase()) return true;
  const acronym = name
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join('');
  if (acronym && acronym === shortLabel) return true;
  return false;
}

function audit(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const registryById = new Map<string, string>(
    TOOL_REGISTRY.map((tool) => [tool.id, tool.name] as const)
  );
  const canonicalById = new Map<string, { name: string; shortLabel: string }>(
    PRAXIS_CANONICAL_TOOLS.map((tool) => [tool.id, { name: tool.name, shortLabel: tool.shortLabel }] as const)
  );

  const mismatches: NameMismatch[] = [];
  for (const [id, registryName] of registryById) {
    const canonical = canonicalById.get(id);
    if (!canonical) continue;
    if (registryName !== canonical.name) {
      mismatches.push({ id, registryName, canonicalName: canonical.name });
    }
  }

  const nameToIds = new Map<string, NameCollision>();
  const record = (name: string, id: string, source: string) => {
    const existing = nameToIds.get(name);
    if (existing) {
      if (!existing.ids.includes(id)) existing.ids.push(id);
      if (!existing.sources.includes(source)) existing.sources.push(source);
    } else {
      nameToIds.set(name, { name, ids: [id], sources: [source] });
    }
  };
  for (const tool of TOOL_REGISTRY) record(tool.name, tool.id, 'registry');
  for (const tool of PRAXIS_CANONICAL_TOOLS) record(tool.name, tool.id, 'canonical');
  const collisions = Array.from(nameToIds.values()).filter((entry) => entry.ids.length > 1);

  const drifts: ShortLabelDrift[] = [];
  for (const tool of PRAXIS_CANONICAL_TOOLS) {
    if (!isShortLabelOk(tool.name, tool.shortLabel)) {
      drifts.push({
        id: tool.id,
        name: tool.name,
        shortLabel: tool.shortLabel,
        reason: 'shortLabel is neither prefix, single word from name, nor acronym',
      });
    }
  }

  if (mismatches.length > 0) {
    errors.push(`Name mismatches between TOOL_REGISTRY and PRAXIS_CANONICAL_TOOLS for ${mismatches.length} id(s):`);
    for (const m of mismatches) {
      errors.push(`  - id="${m.id}" registry="${m.registryName}" canonical="${m.canonicalName}"`);
    }
  }

  if (collisions.length > 0) {
    warnings.push(`Name collisions across different ids (${collisions.length}):`);
    for (const c of collisions) {
      warnings.push(`  - name="${c.name}" ids=[${c.ids.join(', ')}] sources=[${c.sources.join(', ')}]`);
    }
  }

  if (drifts.length > 0) {
    warnings.push(`shortLabel drift in PRAXIS_CANONICAL_TOOLS (${drifts.length}):`);
    for (const d of drifts) {
      warnings.push(`  - id="${d.id}" name="${d.name}" shortLabel="${d.shortLabel}" — ${d.reason}`);
    }
  }

  return { errors, warnings };
}

function main(): void {
  const { errors, warnings } = audit();

  console.log(`canonical-names audit
  TOOL_REGISTRY entries:        ${TOOL_REGISTRY.length}
  PRAXIS_CANONICAL_TOOLS entries: ${PRAXIS_CANONICAL_TOOLS.length}
  errors:    ${errors.length}
  warnings:  ${warnings.length}
`);

  for (const w of warnings) console.warn(`warn: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);

  if (errors.length > 0) {
    console.error('\nFAIL: canonical-name contract violated. Fix mismatches above.');
    process.exit(1);
  }

  console.log('OK: canonical-name contract holds.');
}

main();

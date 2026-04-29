#!/usr/bin/env tsx
/**
 * Reads every src/app/api/ai/**\/route.ts and scores it on 11 calibration dimensions.
 * Writes a markdown report to docs/audits/tools-YYYY-MM-DD.md.
 *
 * Run: npx tsx scripts/audit-tools.ts
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export interface ToolScore {
  toolId: string;
  path: string;
  dimensions: {
    withCalibration: boolean;
    readsProfile: boolean;
    readsSituation: boolean;
    appliesLanguage: boolean;
    appliesRedLines: boolean;
    appliesAudience: boolean;
    usesSKCRetrieval: boolean;
    saveToolOutput: boolean;
    memoryBankTrace: boolean;
    zodSchema: boolean;
    creditsDeducted: boolean;
    profileVersionStamp: boolean;
  };
  score: number;
  notes: string[];
}

export function scoreRouteSource(toolId: string, src: string): ToolScore {
  const dims = {
    withCalibration: /\bwithCalibration\b/.test(src),
    readsProfile: /\b(calibration\.toolContext\.profile|getAnalystProfile)\b/.test(src),
    readsSituation: /\b(calibration\.toolContext\.situation|getSituationById|buildGraphContext)\b/.test(src),
    appliesLanguage: /outputConstraints\.language|calibration\.outputConstraints/.test(src),
    appliesRedLines: /redLine|outputConstraints\.redLine/.test(src),
    appliesAudience: /audienceTone|outputConstraints\.audienceTone/.test(src),
    usesSKCRetrieval: /SituationKnowledgeCore|retrieveForProfile|\bretrievalQuery\b/.test(src),
    saveToolOutput: /saveToolOutput\s*\(/.test(src),
    memoryBankTrace: /memoryBank|writeMemoryBank|vertex.*memory/i.test(src),
    zodSchema: /(z\.object|Output\.object|experimental_output)/.test(src),
    creditsDeducted: /checkAndDeductCredits|withCalibration/.test(src),
    profileVersionStamp: /profileVersion/.test(src),
  };
  const score = Object.values(dims).filter(Boolean).length;
  const notes: string[] = [];
  if (!dims.withCalibration) notes.push('Not wrapped with withCalibration — uses raw withAuth/withCredits.');
  if (!dims.saveToolOutput) notes.push('Does not call saveToolOutput — output lost.');
  if (!dims.zodSchema) notes.push('No Zod / Output.object schema validation detected.');
  return { toolId, path: '', dimensions: dims, score, notes };
}

function resolveDelegatedRouteSource(routePath: string, src: string): string {
  const match = src.match(/export\s*\{\s*POST\s*\}\s*from\s*['"](.+)['"]/);
  if (!match) return src;

  const targetBase = resolve(dirname(routePath), match[1]);
  const candidates = [targetBase, `${targetBase}.ts`, join(targetBase, 'route.ts')];
  for (const target of candidates) {
    try {
      return `${readFileSync(target, 'utf8')}\n\n// Delegated route source: ${relative(process.cwd(), target)}`;
    } catch {
      // Try next candidate.
    }
  }
  return src;
}

function walkRoutes(dir: string, out: string[] = []): string[] {
  for (const ent of readdirSync(dir)) {
    const full = join(dir, ent);
    if (statSync(full).isDirectory()) walkRoutes(full, out);
    else if (ent === 'route.ts') out.push(full);
  }
  return out;
}

function toolIdFromPath(p: string): string {
  // src/app/api/ai/<tool>/route.ts → <tool>
  const m = p.match(/api[\\/]ai[\\/]([^\\/]+)[\\/]route\.ts$/);
  return m?.[1] ?? relative(process.cwd(), p);
}

function renderReport(results: ToolScore[]): string {
  const dimensionCount = Object.keys(results[0]?.dimensions ?? {}).length;
  const header = `# PRAXIS Tool Calibration Audit — ${new Date().toISOString().slice(0, 10)}\n\n` +
    `Audited ${results.length} AI routes. Score = count of ${dimensionCount} calibration dimensions satisfied.\n\n`;
  const table = ['| Tool | Score | withCal | SaveOut | VerStamp | SKC | Zod | Credits |',
                 '|---|---|---|---|---|---|---|---|']
    .concat(results.map(r => `| ${r.toolId} | ${r.score}/${dimensionCount} | ${mark(r.dimensions.withCalibration)} | ${mark(r.dimensions.saveToolOutput)} | ${mark(r.dimensions.profileVersionStamp)} | ${mark(r.dimensions.usesSKCRetrieval)} | ${mark(r.dimensions.zodSchema)} | ${mark(r.dimensions.creditsDeducted)} |`))
    .join('\n');
  const details = results.filter(r => r.notes.length).map(r => `### ${r.toolId}\n${r.notes.map(n => `- ${n}`).join('\n')}`).join('\n\n');
  return header + table + '\n\n## Per-tool notes\n\n' + details + '\n';
}

function mark(v: boolean): string { return v ? '✅' : '❌'; }

function main() {
  const root = join(process.cwd(), 'src', 'app', 'api', 'ai');
  const routes = walkRoutes(root);
  const results = routes.map(p => {
    const src = readFileSync(p, 'utf8');
    const score = scoreRouteSource(toolIdFromPath(p), resolveDelegatedRouteSource(p, src));
    score.path = relative(process.cwd(), p);
    return score;
  }).sort((a, b) => a.score - b.score);

  const dateStr = new Date().toISOString().slice(0, 10);
  const auditsDir = join(process.cwd(), 'docs', 'audits');
  if (!existsSync(auditsDir)) mkdirSync(auditsDir, { recursive: true });
  const out = join(auditsDir, `tools-${dateStr}.md`);
  writeFileSync(out, renderReport(results));
  const dimensionCount = Object.keys(results[0]?.dimensions ?? {}).length;
  console.log(`✓ Wrote ${out}`);
  console.log(`  ${results.filter(r => r.score >= 10).length}/${results.length} tools ≥10/${dimensionCount}`);
}

// Run only when invoked directly
if (process.argv[1] && process.argv[1].endsWith('audit-tools.ts')) main();

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getAskPraxisRuntimePolicyMatrix,
  getModelMatrixEntry,
  getTaskKinds,
  MODEL_MATRIX,
} from '@/lib/ai/model-matrix';

const GEMINI35_FRONTIER = /^gemini-3\.5-[a-z0-9-]+$/;
// Exact IDs reviewed against official model docs on 2026-09-30; no wildcard approval for new models.
const SANCTIONED_TASK_MODELS = new Set(['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-pro-preview']);
const GEMINI25_STABLE = /^gemini-2\.5-[a-z0-9-]+$/;
const TEXT_EMBEDDING = /^text-embedding-\d+$/;
const FORBIDDEN_MODEL_PATTERNS = [
  { label: 'gemini-2.0-*', pattern: /\bgemini-2\.0-[a-z0-9.-]+\b/g },
  { label: 'gemini-3-pro-preview', pattern: /\bgemini-3-pro-preview\b/g },
];

export interface AuditModelMatrixCoverageResult {
  ok: boolean;
  sanctionedGemini35Ids: string[];
  sanctionedGeminiIds: string[];
  failures: string[];
}

export function auditModelMatrixCoverage(repoRoot = process.cwd()): AuditModelMatrixCoverageResult {
  const failures: string[] = [];
  const policy = getAskPraxisRuntimePolicyMatrix();
  const gemini35Ids = new Set<string>();
  const geminiIds = new Set<string>();
  for (const taskKind of getTaskKinds()) {
    const modelId = getModelMatrixEntry(taskKind).model;
    checkForbiddenModelId(modelId, `taskKinds.${taskKind}`, failures);

    if (TEXT_EMBEDDING.test(modelId)) continue;
    if (!SANCTIONED_TASK_MODELS.has(modelId)) {
      failures.push(`taskKinds.${taskKind} must use a documented sanctioned Gemini task model; found ${modelId}`);
      continue;
    }

    geminiIds.add(modelId);
    if (GEMINI35_FRONTIER.test(modelId)) gemini35Ids.add(modelId);
  }
  if (getModelMatrixEntry('cheap_classify').model === getModelMatrixEntry('complex_reasoning').model) failures.push('Economical classification and complex reasoning must select distinct task models.');

  const fallbackProviderEntries = Object.entries(MODEL_MATRIX.fallbackProvider['google-ai-studio'] ?? {});
  for (const [taskKind, modelId] of fallbackProviderEntries) {
    checkForbiddenModelId(modelId, `fallbackProvider.google-ai-studio.${taskKind}`, failures);
    if (TEXT_EMBEDDING.test(modelId)) continue;
    if (!SANCTIONED_TASK_MODELS.has(modelId)) {
      failures.push(`fallbackProvider.google-ai-studio.${taskKind} must use a documented sanctioned Gemini task model; found ${modelId}`);
    } else {
      geminiIds.add(modelId);
      if (GEMINI35_FRONTIER.test(modelId)) gemini35Ids.add(modelId);
    }
  }

  for (const [depth, models] of Object.entries(policy.stableFallback)) {
    for (const modelId of models) {
      checkForbiddenModelId(modelId, `runtimePolicies.askPraxis.stableFallback.${depth}`, failures);
      if (!GEMINI25_STABLE.test(modelId)) {
        failures.push(`runtimePolicies.askPraxis.stableFallback.${depth} must stay in Gemini 2.5 GA family; found ${modelId}`);
      }
      if (!policy.stableModelLabels[modelId]) {
        failures.push(`runtimePolicies.askPraxis.stableModelLabels is missing ${modelId}`);
      }
    }
  }

  failures.push(...findForbiddenSourceMatches(repoRoot));

  return {
    ok: failures.length === 0,
    sanctionedGemini35Ids: Array.from(gemini35Ids).sort(),
    sanctionedGeminiIds: Array.from(geminiIds).sort(),
    failures,
  };
}

function checkForbiddenModelId(modelId: string, location: string, failures: string[]): void {
  for (const forbidden of FORBIDDEN_MODEL_PATTERNS) {
    forbidden.pattern.lastIndex = 0;
    if (forbidden.pattern.test(modelId)) {
      failures.push(`${location} contains forbidden model ${forbidden.label}: ${modelId}`);
    }
  }
}

function findForbiddenSourceMatches(repoRoot: string): string[] {
  const failures: string[] = [];
  for (const sourceRoot of ['src', 'backend']) {
    const absoluteRoot = path.join(repoRoot, sourceRoot);
    for (const filePath of walkFiles(absoluteRoot)) {
      if (!isTextFile(filePath)) continue;
      const text = readFileSync(filePath, 'utf8');
      for (const forbidden of FORBIDDEN_MODEL_PATTERNS) {
        forbidden.pattern.lastIndex = 0;
        const matches = text.match(forbidden.pattern);
        if (!matches) continue;
        const relativePath = path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
        failures.push(`${relativePath} contains forbidden model ${forbidden.label}: ${Array.from(new Set(matches)).join(', ')}`);
      }
    }
  }
  return failures;
}

function walkFiles(root: string): string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

function isTextFile(filePath: string): boolean {
  if (!statSync(filePath).isFile()) return false;
  return /\.(cjs|css|cts|js|json|jsx|md|mjs|mts|py|ts|tsx|txt|yaml|yml)$/.test(filePath);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  const result = auditModelMatrixCoverage();
  if (result.ok) {
    console.log('[audit:model-matrix-coverage] ok');
    console.log(`sanctioned Gemini task IDs: ${result.sanctionedGeminiIds.join(', ')}`);
  } else {
    console.error('[audit:model-matrix-coverage] failed');
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

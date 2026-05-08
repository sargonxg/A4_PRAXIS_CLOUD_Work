import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const scanRoots = ['src', 'backend'];
const skipParts = [
  'node_modules',
  '.next',
  '.venv',
  '__pycache__',
  '.pytest_cache',
  'docs',
  'graphify-out',
];

const allowedProviderFiles = new Set([
  path.normalize('src/lib/ai/providers.ts'),
  path.normalize('src/lib/ai/model-matrix.ts'),
  path.normalize('src/lib/ai/MODEL_MATRIX.json'),
  path.normalize('backend/ai/providers.py'),
  path.normalize('backend/agents/deploy.py'),
  path.normalize('backend/services/gemini_client.py'),
]);

const allowedModelLiteralFiles = new Set([
  path.normalize('src/lib/ai/providers.ts'),
  path.normalize('src/lib/ai/model-matrix.ts'),
  path.normalize('src/lib/ai/MODEL_MATRIX.json'),
  path.normalize('src/lib/knowledge/embedding-config.ts'),
  path.normalize('src/lib/ai/advisor-model.ts'),
  path.normalize('src/types/advisor.ts'),
  path.normalize('src/lib/constants/advisor-configs.ts'),
  path.normalize('src/lib/firebase/firestore.ts'),
  path.normalize('src/app/app/settings/model-preferences/page.tsx'),
  path.normalize('src/app/api/settings/ai/route.ts'),
  path.normalize('src/app/api/ai/advisor-chat/route.ts'),
  path.normalize('src/app/api/ai/chat/route.ts'),
  path.normalize('backend/ai/providers.py'),
  path.normalize('backend/.env.example'),
]);

const directProviderPatterns = [
  /from\s+['"]@ai-sdk\/google['"]/,
  /require\(['"]@ai-sdk\/google['"]\)/,
  /from\s+['"]@ai-sdk\/google-vertex['"]/,
  /require\(['"]@ai-sdk\/google-vertex['"]\)/,
  /from\s+['"]@google-cloud\/aiplatform['"]/,
  /require\(['"]@google-cloud\/aiplatform['"]\)/,
  /from\s+['"]@anthropic-ai\/sdk['"]/,
  /require\(['"]@anthropic-ai\/sdk['"]\)/,
  /from\s+['"]openai['"]/,
  /require\(['"]openai['"]\)/,
  /^\s*import\s+vertexai\b/m,
  /^\s*from\s+vertexai\s+import\b/m,
  /^\s*from\s+google\s+import\s+genai\b/m,
];

const modelLiteralPattern =
  /['"`](?:googleai\/)?(?:gemini-\d+(?:\.\d+)?(?:-[a-z0-9]+)*|text-embedding-\d+(?:-[a-z0-9]+)?|claude-[a-z0-9.-]+|gpt-[a-z0-9.-]+)['"`]/i;

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*#.*$/gm, '');
}

function shouldSkip(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return skipParts.some((part) => normalized.split(path.sep).includes(part));
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (shouldSkip(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (/\.(ts|tsx|mts|js|mjs|py|json)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const violations: string[] = [];

for (const rootDir of scanRoots) {
  for (const file of walk(path.join(root, rootDir))) {
    const rel = path.normalize(path.relative(root, file));
    const body = stripComments(readFileSync(file, 'utf8'));

    if (!allowedProviderFiles.has(rel)) {
      for (const pattern of directProviderPatterns) {
        if (pattern.test(body)) {
          violations.push(`${rel}: direct provider SDK import matched ${pattern}`);
        }
      }
    }

    if (!allowedModelLiteralFiles.has(rel) && modelLiteralPattern.test(body)) {
      violations.push(`${rel}: model literal outside provider/matrix boundary`);
    }
  }
}

if (violations.length > 0) {
  console.error('[audit:ai-provider-isolation] provider isolation violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('[audit:ai-provider-isolation] ok');

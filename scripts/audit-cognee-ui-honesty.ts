import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const UI_ROOTS = ['src/app', 'src/components'].map((path) => join(ROOT, path));
const FEATURE_ROUTE = 'src/app/api/health/features/route.ts';
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx']);
const FORBIDDEN_PATTERNS = [
  /Cognee/i,
  /memify/i,
  /memory recall/i,
  /improve memory/i,
  /saved to memory/i,
  /memory queued/i,
  /memory layer/i,
];

interface Finding {
  file: string;
  line: number;
  text: string;
}

function extension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function relativePath(file: string): string {
  return relative(ROOT, file).replace(/\\/g, '/');
}

function lineNumber(content: string, index: number): number {
  return content.slice(0, Math.max(0, index)).split('\n').length;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const rel = relativePath(full);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (rel === 'src/app/api' || rel.startsWith('src/app/api/')) return [];
      return walk(full);
    }
    return EXTENSIONS.has(extension(full)) ? [full] : [];
  });
}

function isCogneeGated(content: string): boolean {
  return content.includes('useFeatureFlags')
    && content.includes('cogneeEnabled')
    && content.includes('features.cognee.enabled');
}

const featureRoute = readFileSync(join(ROOT, FEATURE_ROUTE), 'utf8');
const findings: Finding[] = [];

if (!featureRoute.includes("process.env.COGNEE_ENABLED === 'true'")) {
  findings.push({
    file: FEATURE_ROUTE,
    line: 1,
    text: 'feature flag must default to disabled unless COGNEE_ENABLED is exactly true',
  });
}

if (!featureRoute.includes('process.env.VERTEX_AGENT_ENGINE_ID')) {
  findings.push({
    file: FEATURE_ROUTE,
    line: 1,
    text: 'agentEngineSubagents must derive from VERTEX_AGENT_ENGINE_ID',
  });
}

for (const file of UI_ROOTS.flatMap(walk)) {
  const content = readFileSync(file, 'utf8');

  if (content.includes('subagentDeps.map') && !content.includes('agentEngineSubagents.enabled')) {
    findings.push({
      file: relativePath(file),
      line: lineNumber(content, content.indexOf('subagentDeps.map')),
      text: 'subagent dependency pills must be gated by agentEngineSubagents.enabled',
    });
  }

  if (isCogneeGated(content)) continue;

  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = pattern.exec(content);
    if (!match) continue;
    findings.push({
      file: relativePath(file),
      line: lineNumber(content, match.index),
      text: `ungated visible Cognee/memory promise: ${match[0]}`,
    });
  }
}

if (findings.length > 0) {
  console.error('[audit:cognee-ui-honesty] failed');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.text}`);
  }
  process.exit(1);
}

console.log('[audit:cognee-ui-honesty] ok');

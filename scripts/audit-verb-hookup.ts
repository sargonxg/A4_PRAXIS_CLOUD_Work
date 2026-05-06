import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SURFACE_DIRS = ['desk', 'context', 'library', 'research', 'graph', 'boardroom', 'draft'];
const ALLOWED_AI_ROUTES = new Set([
  '/api/ai/dialectica',
  '/api/ai/boardroom',
  '/api/ai/brainstorming-table',
  '/api/ai/forecast',
  '/api/ai/legal-check',
  '/api/ai/sanctions-check',
]);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}

const findings: string[] = [];

for (const surface of SURFACE_DIRS) {
  const dir = path.join(ROOT, 'src', 'app', 'app', surface);
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    const matches = text.match(/\/api\/ai\/[a-z0-9-]+/g) ?? [];
    for (const route of matches) {
      if (!ALLOWED_AI_ROUTES.has(route)) {
        findings.push(`${path.relative(ROOT, file)} uses legacy AI route ${route}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('[phase3] verb hookup audit passed');
}

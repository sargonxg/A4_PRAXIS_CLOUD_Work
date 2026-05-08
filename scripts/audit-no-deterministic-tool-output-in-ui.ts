import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const UI_ROOTS = ['src/components', 'src/app'].map((path) => join(ROOT, path));
const FORBIDDEN = ['deterministic-foundation', 'foundation-run', 'marketplace-foundation-v1'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx']);

function extension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (full.includes(`${join('src', 'app', 'api')}`)) return [];
      return walk(full);
    }
    return EXTENSIONS.has(extension(full)) ? [full] : [];
  });
}

const findings = UI_ROOTS.flatMap(walk).flatMap((file) => {
  const content = readFileSync(file, 'utf8');
  return FORBIDDEN.flatMap((marker) => {
    if (!content.includes(marker)) return [];
    return [`${relative(ROOT, file)} contains ${marker}`];
  });
});

if (findings.length > 0) {
  console.error('[audit:no-deterministic-tool-output-in-ui] failed');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('[audit:no-deterministic-tool-output-in-ui] ok (static-marker)');

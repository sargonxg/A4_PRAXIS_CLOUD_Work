import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

function listApiFiles(dir = 'src/app/api'): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...listApiFiles(child));
    } else if (entry.isFile() && child.endsWith('.ts')) {
      files.push(child);
    }
  }
  return files;
}

const base = process.env.AUDIT_SPINE_BASE ?? 'origin/main';
let changed: string[];
try {
  changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter((file) => file.startsWith('src/app/api/') && file.endsWith('.ts') && existsSync(file));
} catch (err) {
  if (process.env.AUDIT_SPINE_SCAN_ALL === '1') {
    console.warn(`[audit-spine] git diff unavailable for ${base}...HEAD; scanning all API files.`);
    changed = listApiFiles();
  } else {
    console.warn(`[audit-spine] git diff unavailable for ${base}...HEAD; skipping diff-only spine audit.`);
    changed = [];
  }
}

const failures: string[] = [];
const excludedPrefixes = [
  'src/app/api/admin/',
  'src/app/api/health/',
  'src/app/api/settings/',
];
const writerPattern = /\.(collection|doc)\s*\(|setDoc\s*\(|addDoc\s*\(|updateDoc\s*\(|deleteDoc\s*\(|adminDb|firestore/i;
const spinePattern = /withCalibration|tool_runs|background_jobs|system_events|systemEvents|writeToolRun/i;
const asyncHandlerPattern = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)|async\s*\([^)]*\)\s*=>/;

for (const file of changed) {
  if (excludedPrefixes.some((prefix) => file.startsWith(prefix))) continue;
  const src = readFileSync(file, 'utf8');
  if (!asyncHandlerPattern.test(src)) continue;
  if (!writerPattern.test(src)) continue;
  if (spinePattern.test(src)) continue;
  failures.push(file);
}

if (failures.length) {
  console.error('Async API writers missing operational spine integration:');
  failures.forEach((file) => console.error(`  ${file}`));
  process.exit(1);
}

console.log(`OK - audit-spine checked ${changed.length} changed API files.`);

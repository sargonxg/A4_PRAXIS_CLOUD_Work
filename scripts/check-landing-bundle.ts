import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, '.next');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const CLIENT_MANIFEST_CANDIDATES = [
  path.join(NEXT_DIR, 'server', 'app', 'page_client-reference-manifest.js'),
  path.join(NEXT_DIR, 'server', 'app', '(landing)', 'page_client-reference-manifest.js'),
];
const LIMIT_BYTES = 280 * 1024;

function gzipSize(filePath: string) {
  return gzipSync(readFileSync(filePath)).byteLength;
}

if (!existsSync(NEXT_DIR)) {
  console.error('Missing .next build output. Run `npm run build` before checking the landing bundle.');
  process.exit(1);
}

const clientManifest = CLIENT_MANIFEST_CANDIDATES.find((candidate) => existsSync(candidate));

if (!clientManifest) {
  console.error('Could not locate the landing client reference manifest. Run `npm run build` first.');
  process.exit(1);
}

const manifestSource = readFileSync(clientManifest, 'utf8');
const manifestJson = manifestSource.match(/=\s*(\{[\s\S]*\});?\s*$/)?.[1];

if (!manifestJson) {
  console.error('Could not parse the landing client reference manifest.');
  process.exit(1);
}

const manifest = JSON.parse(manifestJson) as {
  entryCSSFiles?: Record<string, Array<{ path: string }>>;
  entryJSFiles?: Record<string, string[]>;
};

const landingEntries = [
  '[project]/src/app/page',
  '[project]/src/app/layout',
  '[project]/src/app/(landing)/layout',
  '[project]/src/app/(landing)/page',
];

const assetPaths = new Set<string>();
for (const entry of landingEntries) {
  for (const filePath of manifest.entryJSFiles?.[entry] ?? []) {
    assetPaths.add(filePath);
  }

  for (const file of manifest.entryCSSFiles?.[entry] ?? []) {
    assetPaths.add(file.path);
  }
}

const candidateFiles = [...assetPaths]
  .map((assetPath) => path.join(STATIC_DIR, assetPath.replace(/^static\//, '')))
  .filter((filePath) => existsSync(filePath));

if (candidateFiles.length === 0) {
  console.error('Could not resolve landing route assets from the client reference manifest.');
  process.exit(1);
}

const total = candidateFiles.reduce((sum, filePath) => sum + gzipSize(filePath), 0);
const kb = (total / 1024).toFixed(1);
const limitKb = (LIMIT_BYTES / 1024).toFixed(0);

console.log(`Landing route JS: ${kb} KB gzip across ${candidateFiles.length} chunk(s).`);

if (total > LIMIT_BYTES) {
  console.error(`Landing route exceeds ${limitKb} KB gzip budget.`);
  process.exit(1);
}

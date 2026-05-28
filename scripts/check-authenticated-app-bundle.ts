import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, '.next');
const STATIC_DIR = path.join(NEXT_DIR, 'static');
const LIMIT_BYTES = 1200 * 1024;
const CLIENT_MANIFESTS = [
  path.join(NEXT_DIR, 'server', 'app', 'app', 'page_client-reference-manifest.js'),
  path.join(NEXT_DIR, 'server', 'app', 'app', 'conversations', '[conversationId]', 'page_client-reference-manifest.js'),
];

if (!existsSync(NEXT_DIR)) {
  console.error('Missing .next build output. Run `npm run build` before checking the authenticated app bundle.');
  process.exit(1);
}

const existingManifests = CLIENT_MANIFESTS.filter((filePath) => existsSync(filePath));
if (existingManifests.length === 0) {
  console.error('Could not locate authenticated app client reference manifests. Run `npm run build` first.');
  process.exit(1);
}

const assetPaths = new Set<string>();
for (const manifestPath of existingManifests) {
  const manifestSource = readFileSync(manifestPath, 'utf8');
  const manifestJson = manifestSource.match(/=\s*(\{[\s\S]*\});?\s*$/)?.[1];
  if (!manifestJson) {
    console.error(`Could not parse client reference manifest: ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(manifestJson) as {
    entryCSSFiles?: Record<string, Array<{ path: string }>>;
    entryJSFiles?: Record<string, string[]>;
  };
  for (const files of Object.values(manifest.entryJSFiles ?? {})) {
    for (const filePath of files) assetPaths.add(filePath);
  }
  for (const files of Object.values(manifest.entryCSSFiles ?? {})) {
    for (const file of files) assetPaths.add(file.path);
  }
}

const candidateFiles = [...assetPaths]
  .map((assetPath) => path.join(STATIC_DIR, assetPath.replace(/^static\//, '')))
  .filter((filePath) => existsSync(filePath));

if (candidateFiles.length === 0) {
  console.error('Could not resolve authenticated app route assets from the client reference manifests.');
  process.exit(1);
}

const sourceMaps = candidateFiles
  .map((filePath) => `${filePath}.map`)
  .filter((filePath) => existsSync(filePath));
if (sourceMaps.length > 0) {
  console.error(`Authenticated app route exposes ${sourceMaps.length} browser source map file(s). Disable production source maps before launch.`);
  for (const filePath of sourceMaps.slice(0, 5)) console.error(`  - ${path.relative(ROOT, filePath)}`);
  process.exit(1);
}

const total = candidateFiles.reduce((sum, filePath) => sum + gzipSync(readFileSync(filePath)).byteLength, 0);
const kb = (total / 1024).toFixed(1);
const limitKb = (LIMIT_BYTES / 1024).toFixed(0);

console.log(`Authenticated app route assets: ${kb} KB gzip across ${candidateFiles.length} chunk(s).`);

if (total > LIMIT_BYTES) {
  console.error(`Authenticated app route exceeds ${limitKb} KB gzip budget.`);
  process.exit(1);
}

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function constant(source: string, name: string): string {
  const match = source.match(new RegExp(`export const ${name} = '([^']+)';`));
  if (!match?.[1]) throw new Error(`Missing ${name} in src/lib/constants/app-version.ts`);
  return match[1];
}

const appVersionSource = read('src/lib/constants/app-version.ts');
const releaseSource = read('src/lib/product/release-notes.ts');
const releasePageSource = read('src/app/release-notes/page.tsx');
const changelog = read('CHANGELOG.md');
const packageJson = JSON.parse(read('package.json')) as { version?: string };

const appVersion = constant(appVersionSource, 'APP_VERSION');
const buildDate = constant(appVersionSource, 'APP_BUILD_DATE');
const buildNumber = constant(appVersionSource, 'APP_BUILD_NUMBER');

const failures: string[] = [];

if (!/^\d+\.\d+\.\d+$/.test(appVersion)) {
  failures.push(`APP_VERSION must be semver-like, got ${appVersion}`);
}
if (!/^\d{4}\.\d{2}\.\d{2}$/.test(buildDate)) {
  failures.push(`APP_BUILD_DATE must be YYYY.MM.DD, got ${buildDate}`);
}
if (!/^\d{4}\.\d{2}\.\d{2}\.\d{2}$/.test(buildNumber)) {
  failures.push(`APP_BUILD_NUMBER must be YYYY.MM.DD.NN, got ${buildNumber}`);
}
if (packageJson.version !== appVersion) {
  failures.push(`package.json version ${packageJson.version ?? '<missing>'} does not match APP_VERSION ${appVersion}`);
}
if (!releaseSource.includes(`version: '${appVersion}'`)) {
  failures.push(`release-notes registry does not include current version ${appVersion}`);
}
if (!releaseSource.includes(`buildNumber: '${buildNumber}'`)) {
  failures.push(`release-notes registry does not include current build ${buildNumber}`);
}
if (!releasePageSource.includes("from '@/lib/product/release-notes'")) {
  failures.push('/release-notes page must import the centralized release registry');
}
if (/const notes\s*=/.test(releasePageSource)) {
  failures.push('/release-notes page must not use a page-local notes array');
}
if (!changelog.includes(`Build ${buildNumber}`)) {
  failures.push(`CHANGELOG.md [Unreleased] must mention Build ${buildNumber}`);
}

if (failures.length > 0) {
  console.error('[audit:release-notes] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[audit:release-notes] ok ${appVersion} build ${buildNumber}`);


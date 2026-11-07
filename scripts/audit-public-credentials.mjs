import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Report locations only. Never print matching credential material.
export function auditPublicCredentials(path, content) {
  const findings = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/AQ\.[A-Za-z0-9_-]{25,}/.test(line)) {
      findings.push({ path, line: index + 1, rule: 'service-account-bound-key' });
      continue;
    }
    const siteKey = line.match(/NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_(?:ENTERPRISE|V3)_KEY=([^\s'"|,]*)/);
    if (/\.ya?ml$|(?:^|[/\\])\.env(?:\.|$)/.test(path) || path === 'build environment') {
      if (siteKey?.[1] && !siteKey[1].startsWith('$') && !/^6[A-Za-z0-9_-]+$/.test(siteKey[1])) {
        findings.push({ path, line: index + 1, rule: 'recaptcha-site-key-type' });
      }
    }
  }
  return findings;
}

const excluded = new Set(['.git', 'node_modules', '.next', 'target', 'coverage', 'output', 'graphify-out', '.venv']);
function scan(directory) {
  const findings = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) findings.push(...scan(path));
    else if (/\.(?:[cm]?js|jsx|ts|tsx|json|ya?ml|md|toml|sh|ps1|py)$/.test(entry.name) || entry.name.startsWith('.env') || entry.name === 'Dockerfile') {
      findings.push(...auditPublicCredentials(path, readFileSync(path, 'utf8')));
    }
  }
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = scan(process.cwd());
  if (existsSync('.next/static')) findings.push(...scan(resolve('.next/static')));
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY;
  if (siteKey) findings.push(...auditPublicCredentials('build environment', `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY=${siteKey}`));
  for (const finding of findings) console.error(`${finding.path}:${finding.line}: ${finding.rule}`);
  console.log(`Public credential audit: ${findings.length === 0 ? 'PASS' : 'FAIL'} (${findings.length} findings)`);
  process.exitCode = findings.length ? 1 : 0;
}

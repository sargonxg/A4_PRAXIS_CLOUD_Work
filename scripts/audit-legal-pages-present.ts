import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

const requiredRoutes = [
  'src/app/demo/syria-2024/page.tsx',
  'src/app/waitlist/page.tsx',
  'src/app/(auth)/login/callback/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/legal/privacy/page.tsx',
  'src/app/legal/terms/page.tsx',
  'src/app/legal/security/page.tsx',
  'src/app/legal/data-retention/page.tsx',
];

for (const file of requiredRoutes) {
  const full = join(process.cwd(), file);
  if (!existsSync(full)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(full, 'utf8');
  if (!text.includes('metadata') && !text.includes('export default')) failures.push(`${file} does not look like a valid app route`);
}

const proxyFile = join(process.cwd(), 'src/proxy.ts');
if (!existsSync(proxyFile)) {
  failures.push('missing src/proxy.ts');
} else {
  const proxyText = readFileSync(proxyFile, 'utf8');
  for (const matcher of ["pathname === '/demo/syria-2024'", "'/login/:path*'", "'/waitlist'", "'/legal/:path*'"]) {
    if (!proxyText.includes(matcher)) failures.push(`proxy matcher missing ${matcher}`);
  }
}

const landingFiles = [
  'src/app/(landing)/layout.tsx',
  'src/components/landing/live-demo.tsx',
  'src/components/landing/pricing-cta.tsx',
];
for (const file of landingFiles) {
  const full = join(process.cwd(), file);
  if (!existsSync(full)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(full, 'utf8');
  if (!text.includes('/demo/syria-2024')) failures.push(`${file} does not point primary demo CTA at /demo/syria-2024`);
}

if (failures.length > 0) {
  console.error('Canonical entry routes audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Canonical entry routes audit passed.');

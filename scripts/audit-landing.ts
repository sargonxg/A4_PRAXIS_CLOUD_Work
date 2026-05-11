import { existsSync, readFileSync } from 'node:fs';

const page = readFileSync('src/app/(landing)/page.tsx', 'utf8');
const layout = readFileSync('src/app/(landing)/layout.tsx', 'utf8');
const phase8 = readFileSync('src/components/landing/phase8-wow-landing.tsx', 'utf8');
const docsPage = readFileSync('src/app/docs/page.tsx', 'utf8');
const ogImage = readFileSync('src/app/opengraph-image.tsx', 'utf8');

const requiredPageMarkers = [
  'Phase8WowLanding',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'Google Cloud, Firebase, Firestore, Cloud SQL Postgres, and Secret Manager production path',
];

for (const marker of requiredPageMarkers) {
  if (!page.includes(marker)) throw new Error(`Landing page missing marker: ${marker}`);
}

const requiredHeroMarkers = [
  'PRAXIS by TACITUS',
  'Live demo bar',
  'foreign-policy-analyst',
  'indo-pacific-2026',
  'ai-regulation-2026',
  'fb-sustainability-2026',
  'Run cached answer',
  'demo_question_asked',
  'method_run',
  'sign_up_clicked',
];

for (const marker of requiredHeroMarkers) {
  if (!phase8.includes(marker)) throw new Error(`Phase 8 landing hero missing marker: ${marker}`);
}

const requiredSections = [
  'Two contexts, one engine',
  'The right tools for the work',
  'Drafting that fits the work',
  'Compare plans',
  'Source receipts',
  'No signup wall',
];

for (const marker of requiredSections) {
  if (!phase8.includes(marker)) throw new Error(`Phase 8 landing section missing marker: ${marker}`);
}

const requiredMethodNames = [
  'Stakeholder Power-Interest Map',
  'Grounded Research',
  'Position-vs-Interest Decoder',
  'Scenario Projector',
  'Analysis of Competing Hypotheses',
  'Contradiction Finder',
  'Frame & Narrative Analyzer',
  'Coalition Detector',
  'Commitment Tracker',
  'Memo Drafter',
];

for (const method of requiredMethodNames) {
  if (!phase8.includes(method)) throw new Error(`Phase 8 landing missing MVP method: ${method}`);
}

for (const href of ['/demo/indo-pacific-2026', '/demo/ai-regulation-2026', '/demo/fb-sustainability-2026']) {
  if (!phase8.includes(href) && !docsPage.includes(href)) {
    throw new Error(`Landing/docs missing demo route: ${href}`);
  }
}

for (const nav of ['#two-contexts', '#methods', '#drafting', '#trust', '#pricing']) {
  if (!layout.includes(nav)) throw new Error(`Landing nav missing anchor: ${nav}`);
}

for (const rel of ['src/app/demo/[contextId]/page.tsx', 'src/app/docs/page.tsx', 'src/app/pricing/page.tsx', 'src/app/legal/security/page.tsx']) {
  if (!existsSync(rel)) throw new Error(`Landing target route missing: ${rel}`);
}

if (/syria/i.test(ogImage)) {
  throw new Error('OpenGraph image must be workbench-led and contain no Syria text.');
}

console.log('audit-landing: ok (phase8-static-marker)');

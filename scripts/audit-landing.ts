import { existsSync, readFileSync } from 'node:fs';

const hero = readFileSync('src/components/landing/hero.tsx', 'utf8');
const landingPage = readFileSync('src/app/(landing)/page.tsx', 'utf8');
const login = readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
const ogImage = readFileSync('src/app/opengraph-image.tsx', 'utf8');
const exampleModal = readFileSync('src/components/landing/example-cases-modal.tsx', 'utf8');

if (/syria/i.test(hero)) {
  throw new Error('Landing hero must not contain Syria copy or a direct Syria demo URL.');
}

if (!hero.includes('ExampleCasesModal') || !exampleModal.includes('aria-haspopup="dialog"')) {
  throw new Error('Landing hero secondary example action must open an accessible dialog.');
}

if (!landingPage.includes('ExampleCasesGallery')) {
  throw new Error('Landing page must render the example-cases gallery.');
}

for (const archived of [
  'advisory-council.tsx',
  'ai-companion-section.tsx',
  'data-substrate.tsx',
  'domain-catalogue.tsx',
  'live-platform-preview.tsx',
  'testimonials.tsx',
]) {
  if (!existsSync(`src/components/landing/_archive/${archived}`)) {
    throw new Error(`Missing archived landing component: ${archived}`);
  }
}

if (/Guest-session Syria public-source case/.test(landingPage)) {
  throw new Error('Landing JSON-LD still describes the demo as a Syria-only case.');
}

const requiredExamples = ['Syria', 'Nordalia', 'Sahel', 'housing', 'workplace', 'sanctions'];
const mentionedExamples = requiredExamples.filter((example) => landingPage.toLowerCase().includes(example.toLowerCase()));
if (mentionedExamples.length < 3) {
  throw new Error('Landing JSON-LD must list multiple example cases, not one geography.');
}

if (/syria/i.test(ogImage)) {
  throw new Error('OpenGraph image must be workbench-led and contain no Syria text.');
}

if (!login.includes("resolvePostLoginRedirect")) {
  throw new Error('Login page does not use centralized post-login redirect helper.');
}

console.log('audit-landing: ok (static-marker)');

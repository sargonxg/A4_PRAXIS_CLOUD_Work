import { existsSync, readFileSync } from 'node:fs';

const hero = readFileSync('src/components/landing/hero.tsx', 'utf8');
const landingPage = readFileSync('src/app/(landing)/page.tsx', 'utf8');
const login = readFileSync('src/app/(auth)/login/page.tsx', 'utf8');
const ogImage = readFileSync('src/app/opengraph-image.tsx', 'utf8');
const exampleModal = readFileSync('src/components/landing/example-cases-modal.tsx', 'utf8');
const agenticApp = readFileSync('src/components/landing/agentic-app-section.tsx', 'utf8');
const sixSteps = readFileSync('src/components/landing/six-steps.tsx', 'utf8');

if (/syria/i.test(hero)) {
  throw new Error('Landing hero must not contain Syria copy or a direct Syria demo URL.');
}

if (!hero.includes('ExampleCasesModal') || !exampleModal.includes('aria-haspopup="dialog"')) {
  throw new Error('Landing hero secondary example action must open an accessible dialog.');
}

if (!landingPage.includes('ExampleCasesGallery')) {
  throw new Error('Landing page must render the example-cases gallery.');
}

if (!landingPage.includes('AgenticAppSection')) {
  throw new Error('Landing page must render the design-led agentic app section.');
}

for (const required of ['Home, Ask PRAXIS, Situation Model, Sources, Outputs', 'Guided workflows', 'Mobile-first navigation']) {
  if (!landingPage.includes(required)) {
    throw new Error(`Landing JSON-LD is missing design-led app feature: ${required}`);
  }
}

for (const required of ['PRODUCT_EXPERIENCE_AREAS', 'AGENTIC_WORKFLOWS', 'PRIMARY_MOBILE_WORKFLOWS']) {
  if (!agenticApp.includes(required)) {
    throw new Error(`Agentic landing section must be wired to ${required}.`);
  }
}

for (const required of ['Context cores', 'General PRAXIS', 'User core', 'Team core', 'Situation core']) {
  if (!agenticApp.includes(required)) {
    throw new Error(`Agentic landing section is missing context-core copy: ${required}.`);
  }
}

for (const required of ['Open', 'Ask', 'Model', 'Source', 'Produce', 'Inherit']) {
  if (!sixSteps.includes(`title: "${required}"`)) {
    throw new Error(`Six-step landing workflow is missing "${required}".`);
  }
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

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

function file(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function requireFile(path: string) {
  if (!existsSync(join(process.cwd(), path))) failures.push(`missing deployed surface file: ${path}`);
}

for (const path of [
  'cloudbuild.frontend.yaml',
  'src/app/app/cores/context/page.tsx',
  'src/app/app/cores/user/page.tsx',
  'src/app/app/dashboard/page.tsx',
  'src/app/app/situations/new/page.tsx',
  'src/components/dashboard/ask-praxis-home.tsx',
  'src/components/dashboard/active-core-stack.tsx',
  'src/lib/semantica/context-core-adapter.ts',
  'rust/semantica-core/Cargo.toml',
]) {
  requireFile(path);
}

if (existsSync(join(process.cwd(), 'src/components/contexts/NewContextWizard.tsx'))) {
  failures.push('remove unused NewContextWizard alias; /app/situations/new is the canonical creation surface');
}

if (existsSync(join(process.cwd(), 'src/components/contexts/CreateContextWizard.tsx'))) {
  failures.push('remove unused CreateContextWizard; /app/situations/new is the canonical creation surface');
}

if (existsSync(join(process.cwd(), 'src/lib/contexts/context-create-payload.ts'))) {
  failures.push('remove unused lightweight context-create payload; real creation lives in /app/situations/new');
}

if (existsSync(join(process.cwd(), 'src/components/v7'))) {
  failures.push('src/components/v7 must not reappear in current-main deployed surface');
}

if (failures.length === 0) {
  const cloudbuild = file('cloudbuild.frontend.yaml');
  for (const marker of [
    'praxis-frontend',
    'NEXT_PUBLIC_SITE_URL=https://praxis.tacitus.me',
    '- run',
    '- deploy',
  ]) {
    if (!cloudbuild.includes(marker)) failures.push(`frontend deploy config missing ${marker}`);
  }

  const newSituation = file('src/app/app/situations/new/page.tsx');
  for (const marker of [
    'buildSemanticaSituationGraph',
    'semanticaContextGraph',
    'semanticaLayer',
    '/api/situations',
  ]) {
    if (!newSituation.includes(marker)) failures.push(`real app context creation missing ${marker}`);
  }

  const contextCore = file('src/app/app/cores/context/page.tsx');
  for (const marker of ['Build Context Core', '/app/situations/new', 'Semantic Seed']) {
    if (!contextCore.includes(marker)) failures.push(`Context Core page missing ${marker}`);
  }

  const publicContexts = file('src/app/contexts/page.tsx');
  if (publicContexts.includes('CreateContextWizard')) {
    failures.push('public /contexts route must not expose duplicate context creation');
  }
  if (!publicContexts.includes('/app/cores/context')) {
    failures.push('public /contexts route must point to canonical app Context Core');
  }

  const dashboard = file('src/components/dashboard/ask-praxis-home.tsx');
  for (const marker of ['Ask PRAXIS', '/app/cores/user', '/app/cores/context']) {
    if (!dashboard.includes(marker)) failures.push(`Ask dashboard missing ${marker}`);
  }

  const sidebar = file('src/components/app/app-sidebar.tsx');
  for (const marker of ['href="/cores/context"', 'href="/cores/user"', 'href="/situations/new"']) {
    if (!sidebar.includes(marker)) failures.push(`app sidebar missing PraxisLink-relative route ${marker}`);
  }

  const rust = file('rust/semantica-core/src/lib.rs');
  for (const marker of ['validate_context_graph_json', 'semantica_ready', 'MAX_NODES', 'MAX_EDGES']) {
    if (!rust.includes(marker)) failures.push(`Rust semantic core missing ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('[audit:deployed-mvp-surface] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:deployed-mvp-surface] ok');

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AGENTIC_WORKFLOWS } from '../src/lib/agentic-workflows/registry';
import { mapRouteToExperienceArea, PRODUCT_EXPERIENCE_AREAS, PRODUCT_EXPERIENCE_ROUTES } from '../src/lib/product/experience-map';

const APP_ROOT = join(process.cwd(), 'src', 'app', 'app');
const failures: string[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    return stat.isDirectory() ? walk(full) : full.endsWith('page.tsx') ? [full] : [];
  });
}

function routeFromPageFile(file: string): string {
  const rel = file.slice(APP_ROOT.length).replace(/\\/g, '/').replace(/\/page\.tsx$/, '');
  return `/app${rel}`;
}

const areaIds = new Set(PRODUCT_EXPERIENCE_AREAS.map((area) => area.id));
const mappedRoutePatterns = new Set(PRODUCT_EXPERIENCE_ROUTES.map((route) => route.pattern));
const workflowIds = new Set<string>();

for (const route of PRODUCT_EXPERIENCE_ROUTES) {
  if (!areaIds.has(route.area)) failures.push(`${route.pattern} maps to unknown area "${route.area}"`);
  if (!route.label.trim()) failures.push(`${route.pattern} is missing a label`);
}

for (const route of walk(APP_ROOT).map(routeFromPageFile)) {
  if (!mapRouteToExperienceArea(route)) failures.push(`${route} is not mapped to a product experience area`);
}

for (const area of PRODUCT_EXPERIENCE_AREAS) {
  if (!area.defaultHref.startsWith('/app')) failures.push(`${area.id} defaultHref must stay inside /app`);
  if (area.summary.length < 35) failures.push(`${area.id} summary is too thin to guide the v7 UI`);
}

for (const workflow of AGENTIC_WORKFLOWS) {
  if (workflowIds.has(workflow.id)) failures.push(`duplicate workflow id: ${workflow.id}`);
  workflowIds.add(workflow.id);
  if (!areaIds.has(workflow.primaryArea)) failures.push(`${workflow.id} has unknown primaryArea ${workflow.primaryArea}`);
  if (workflow.requiredContext.length === 0) failures.push(`${workflow.id} declares no required context`);
  if (workflow.routes.length === 0) failures.push(`${workflow.id} declares no routes`);
  if (workflow.existingComponents.length === 0) failures.push(`${workflow.id} declares no existing components`);
  if (!workflow.saveLocation.trim()) failures.push(`${workflow.id} declares no save location`);
  if (!workflow.prompt.endsWith('.') && !workflow.prompt.endsWith('?')) {
    failures.push(`${workflow.id} prompt should be paste-ready sentence copy`);
  }
  for (const route of workflow.routes) {
    const [path] = route.split('?');
    if (path.startsWith('/app') && !mappedRoutePatterns.has(path)) {
      failures.push(`${workflow.id} references unmapped app route ${path}`);
    }
    if (!path.startsWith('/app') && !path.startsWith('/api')) {
      failures.push(`${workflow.id} route must start with /app or /api: ${route}`);
    }
  }
}

for (const requiredArea of ['home', 'ask', 'cores', 'outputs'] as const) {
  if (!areaIds.has(requiredArea)) failures.push(`missing v7 product area: ${requiredArea}`);
}

for (const requiredWorkflow of ['understand-situation', 'improve-context', 'generate-handover']) {
  if (!workflowIds.has(requiredWorkflow)) failures.push(`missing founder-priority workflow: ${requiredWorkflow}`);
}

if (failures.length > 0) {
  console.error('[audit:experience-map-coherence] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:experience-map-coherence] ok');

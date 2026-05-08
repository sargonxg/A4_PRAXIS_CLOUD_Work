import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

for (const route of PRODUCT_EXPERIENCE_ROUTES) {
  if (!areaIds.has(route.area)) failures.push(`${route.pattern} maps to unknown area "${route.area}"`);
  if (!route.label.trim()) failures.push(`${route.pattern} is missing a label`);
}

for (const route of walk(APP_ROOT).map(routeFromPageFile)) {
  if (!mapRouteToExperienceArea(route)) failures.push(`${route} is not mapped to a product experience area`);
}

if (failures.length > 0) {
  console.error('[audit:experience-map-coherence] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:experience-map-coherence] ok');

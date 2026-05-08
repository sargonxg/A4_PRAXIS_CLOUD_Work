import { PRODUCT_SURFACES } from '../src/lib/navigation/product-surfaces';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';
import { WORKBENCH_TABS } from '../src/lib/workbench/tabs';

const failures: string[] = [];

const tabIds = new Set(WORKBENCH_TABS.map((tab) => tab.id));
const chapterIds = new Set(WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id));
const reachableSurfaceIds = new Set([...tabIds, ...chapterIds]);

for (const surface of PRODUCT_SURFACES) {
  if (!reachableSurfaceIds.has(surface.id)) {
    failures.push(`product surface "${surface.id}" is not reachable through a workbench tab or chapter`);
  }
  if (!surface.href.startsWith('/')) {
    failures.push(`product surface "${surface.id}" has a non-route href "${surface.href}"`);
  }
  if (!surface.summary.trim()) {
    failures.push(`product surface "${surface.id}" is missing summary copy`);
  }
}

for (const tab of WORKBENCH_TABS) {
  const surface = PRODUCT_SURFACES.find((item) => item.id === tab.id);
  if (!surface && tab.id !== 'ontology') {
    failures.push(`workbench tab "${tab.id}" is missing from PRODUCT_SURFACES`);
  }
}

for (const chapter of WORKBENCH_CHAPTER_FLOW) {
  const surface = PRODUCT_SURFACES.find((item) => item.id === chapter.id);
  if (!surface && !['memos', 'ach'].includes(chapter.id)) {
    failures.push(`workbench chapter "${chapter.id}" is missing from PRODUCT_SURFACES`);
  }
}

if (failures.length > 0) {
  console.error('[audit:surface-registry-coherence] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:surface-registry-coherence] ok');

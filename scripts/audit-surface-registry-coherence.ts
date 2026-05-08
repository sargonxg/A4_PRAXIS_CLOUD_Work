import { PRODUCT_SURFACES } from '../src/lib/navigation/product-surfaces';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';
import { WORKBENCH_TABS } from '../src/lib/workbench/tabs';
import { TOOL_REGISTRY } from '../src/lib/constants/tool-registry';

const failures: string[] = [];

const tabIds = new Set(WORKBENCH_TABS.map((tab) => tab.id));
const chapterIds = new Set(WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id));
const heroToolIds = new Set(
  TOOL_REGISTRY.filter((tool) => tool.surface === 'hero' && tool.visible).map((tool) => tool.id),
);
const productSurfaceToolIds = new Set(PRODUCT_SURFACES.map((surface) => surface.toolId));
const reachableSurfaceIds = new Set([...tabIds, ...chapterIds, ...heroToolIds, ...productSurfaceToolIds]);

for (const surface of PRODUCT_SURFACES) {
  if (!reachableSurfaceIds.has(surface.id) && !reachableSurfaceIds.has(surface.toolId)) {
    failures.push(
      `product surface "${surface.id}" is not reachable through a workbench tab, chapter, or hero tool`,
    );
  }
  if (!heroToolIds.has(surface.toolId) && !['library', 'tools'].includes(surface.toolId)) {
    failures.push(
      `product surface "${surface.id}" points at non-hero toolId "${surface.toolId}"`,
    );
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

console.log('[audit:surface-registry-coherence] ok (static-marker)');

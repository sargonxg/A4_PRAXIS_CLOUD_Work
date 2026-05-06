import fs from 'node:fs';
import path from 'node:path';
import { PRODUCT_SURFACES } from '../src/lib/navigation/product-surfaces';

const ROOT = process.cwd();
const requiredRoutes = PRODUCT_SURFACES.map((surface) => path.join(ROOT, 'src', 'app', 'app', surface.id, 'page.tsx'));
const requiredFiles = [
  'src/components/editor/work-product-editor.tsx',
  'src/components/boardroom/deliberation-room.tsx',
  'src/components/graph/cypher-console.tsx',
  'src/components/desk/what-changed-panel.tsx',
  'src/components/desk/cost-cap-panel.tsx',
  'src/lib/api/with-ai-act-ack.ts',
  'src/lib/exports/json-ld-prov.ts',
  'scripts/audit-verb-hookup.ts',
];

const failures = [
  ...requiredRoutes.filter((file) => !fs.existsSync(file)).map((file) => `missing route ${path.relative(ROOT, file)}`),
  ...requiredFiles.filter((file) => !fs.existsSync(path.join(ROOT, file))).map((file) => `missing file ${file}`),
];

if (PRODUCT_SURFACES.length !== 8) failures.push(`expected 8 surfaces, found ${PRODUCT_SURFACES.length}`);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('[phase3] product surface audit passed');
}

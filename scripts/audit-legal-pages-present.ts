import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

for (const file of ['src/app/privacy/page.tsx', 'src/app/terms/page.tsx']) {
  const full = join(process.cwd(), file);
  if (!existsSync(full)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(full, 'utf8');
  if (!text.includes('metadata') && !text.includes('export default')) failures.push(`${file} does not look like a valid app route`);
}

if (failures.length > 0) {
  console.error('Legal pages audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Legal pages audit passed.');

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const reportPath = join(process.cwd(), 'docs/audits/2026-05-06-REALITY_CHECK.md');
const backlogPath = join(process.cwd(), 'docs/backlog/2026-05-06-from-reality-check.md');
const failures: string[] = [];

if (!existsSync(reportPath)) failures.push('missing docs/audits/2026-05-06-REALITY_CHECK.md');
if (!existsSync(backlogPath)) failures.push('missing docs/backlog/2026-05-06-from-reality-check.md');

if (existsSync(reportPath)) {
  const report = readFileSync(reportPath, 'utf8');
  for (const section of ['Pack 03', 'Pack 04', 'Pack 05', 'Pack 06', 'Pack 07', 'Pack 08', 'Pack 09', 'Pack 10', 'Pack 11', 'Pack 12', 'Pack 13']) {
    if (!report.includes(section)) failures.push(`missing report section ${section}`);
  }
  if (!report.includes('Quality State')) failures.push('missing Quality State section');
  if (/S[01]_OPEN/.test(report)) failures.push('report still contains open S0/S1 launch blockers');
}

if (failures.length > 0) {
  console.error('Reality check audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Reality check audit passed. (static-marker)');

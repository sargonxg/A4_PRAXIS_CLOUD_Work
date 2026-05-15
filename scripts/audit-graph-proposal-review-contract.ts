import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const root = process.cwd();
const graphProposeRoute = readFileSync(join(root, 'src/app/api/ai/graph-propose/route.ts'), 'utf8');
const approveRoute = readFileSync(join(root, 'src/app/api/graph/proposals/[id]/approve/route.ts'), 'utf8');
const rejectRoute = readFileSync(join(root, 'src/app/api/graph/proposals/[id]/reject/route.ts'), 'utf8');
const graphService = readFileSync(join(root, 'src/lib/firebase/graph-updates-service.ts'), 'utf8');

if (!graphProposeRoute.includes('createGraphUpdateProposal')) {
  failures.push('/api/ai/graph-propose must create review queue proposals');
}
if (!graphProposeRoute.includes('reviewRequired: true')) {
  failures.push('/api/ai/graph-propose must advertise mandatory review');
}
if (!approveRoute.includes('applyApprovedProposal')) {
  failures.push('graph proposal approval must be the only canonical promotion route');
}
if (!rejectRoute.includes('rejectProposal')) {
  failures.push('graph proposal rejection route is required');
}
if (!graphService.includes("status: 'proposed'")) {
  failures.push('graph proposal creation must persist proposed status first');
}

if (failures.length > 0) {
  console.error('audit:graph-proposal-review-contract failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('audit:graph-proposal-review-contract OK');

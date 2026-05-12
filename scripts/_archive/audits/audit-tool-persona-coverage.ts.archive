import { existsSync, readFileSync } from 'node:fs';
import { MARKETPLACE_TOOLS } from '../src/lib/tools/marketplace/registry';
import { buildMarketplaceSemanticProfile } from '../src/lib/tools/marketplace/semantic-canaries';

const requiredRoles = new Set([
  'diplomat',
  'mediator',
  'analyst',
  'researcher',
  'policy_advisor',
  'human_rights_officer',
  'sanctions_analyst',
  'humanitarian_coordinator',
  'treaty_lawyer',
  'defense_analyst',
]);
const failures: string[] = [];
const roleCounts = new Map<string, number>();

for (const tool of MARKETPLACE_TOOLS) {
  const profile = buildMarketplaceSemanticProfile(tool);
  if (profile.personaRoles.length === 0) failures.push(`${tool.id}: missing persona coverage`);
  for (const role of profile.personaRoles) {
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }
}

for (const role of requiredRoles) {
  if ((roleCounts.get(role) ?? 0) === 0) failures.push(`${role}: no marketplace tools assigned`);
}

const streakPath = 'docs/audits/persona-green-streak.md';
if (!existsSync(streakPath)) {
  failures.push(`${streakPath}: missing Pack 21 green-streak ledger`);
} else {
  const text = readFileSync(streakPath, 'utf8');
  if (!text.includes('Pack 21 reset')) failures.push(`${streakPath}: missing Pack 21 reset marker`);
  if (!text.includes('10-green-run target')) failures.push(`${streakPath}: missing 10-green-run target marker`);
}

if (failures.length > 0) {
  console.error('Tool persona coverage audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool persona coverage audit passed for ${MARKETPLACE_TOOLS.length} tools across ${requiredRoles.size} roles. (static-marker)`);

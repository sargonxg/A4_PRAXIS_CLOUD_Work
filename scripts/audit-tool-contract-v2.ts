import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const failures: string[] = [];

for (const tool of MARKETPLACE_TOOLS) {
  if (!tool.version?.startsWith('2.')) failures.push(`${tool.id} missing v2 version`);
  if (!tool.title) failures.push(`${tool.id} missing title`);
  if (!tool.contractCategory) failures.push(`${tool.id} missing contractCategory`);
  if (tool.satCategory && !['ach', 'kac', 'red_team', 'premortem'].includes(tool.satCategory)) failures.push(`${tool.id} invalid satCategory`);
  if (!tool.contextSpec) failures.push(`${tool.id} missing contextSpec`);
  if (tool.contextSpec.minHealthScore && tool.contextSpec.minHealthScore > 100) failures.push(`${tool.id} invalid minHealthScore`);
  if (tool.contextSpec.graceful !== true) failures.push(`${tool.id} must run gracefully with partial context`);
  if (!tool.composition || !Array.isArray(tool.composition.canChainInto)) failures.push(`${tool.id} missing composition`);
  if (!tool.composition.contextProjection) failures.push(`${tool.id} missing context projection`);
  if (tool.composition.contextProjection && !existsSync(join(process.cwd(), tool.composition.contextProjection))) {
    failures.push(`${tool.id} missing ${tool.composition.contextProjection}`);
  }
  if (!tool.sideEffects || tool.sideEffects.writesAuditLogs !== true) failures.push(`${tool.id} must write audit logs`);
  if (!tool.subagentDeps?.includes('context-preparer')) failures.push(`${tool.id} must declare context-preparer`);
  if (!tool.skill?.file) failures.push(`${tool.id} missing skill file pointer`);
  if (tool.skill?.file && !existsSync(join(process.cwd(), tool.skill.file))) failures.push(`${tool.id} missing ${tool.skill.file}`);
}

if (failures.length > 0) {
  console.error('Tool contract v2 audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool contract v2 audit passed for ${MARKETPLACE_TOOLS.length} tools.`);

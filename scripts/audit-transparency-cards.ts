import { existsSync, readFileSync } from 'node:fs';
import { MARKETPLACE_HANDLER_CONTRACTS } from '@/lib/tools/marketplace/handler-contracts';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { buildToolTransparencyCard } from '@/lib/tools/marketplace/transparency';

const failures: string[] = [];
const componentPath = 'src/components/tools/ToolTransparencyCard.tsx';
const marketplacePath = 'src/components/tools/ToolMarketplace.tsx';

if (!existsSync(componentPath)) failures.push('missing ToolTransparencyCard component');
if (!existsSync(marketplacePath)) failures.push('missing ToolMarketplace component');

if (existsSync(marketplacePath)) {
  const marketplace = readFileSync(marketplacePath, 'utf8');
  if (!marketplace.includes('ToolTransparencyCard')) failures.push('ToolMarketplace does not render transparency cards');
  if (!marketplace.includes('<ToolTransparencyCard tool={tool} />')) failures.push('ToolMarketplace must pass each visible tool into ToolTransparencyCard');
}

for (const tool of MARKETPLACE_TOOLS) {
  const contract = MARKETPLACE_HANDLER_CONTRACTS[tool.id];
  if (!contract) failures.push(`${tool.id} missing handler contract for transparency derivation`);

  const card = buildToolTransparencyCard(tool);
  if (card.toolId !== tool.id) failures.push(`${tool.id} transparency card id mismatch`);
  if (card.methodology.length < 80) failures.push(`${tool.id} methodology is too thin`);
  if (card.limitations.length < 3) failures.push(`${tool.id} needs at least 3 limitations`);
  if (card.evaluationMetrics.length < 4) failures.push(`${tool.id} needs at least 4 evaluation metrics`);
  if (card.expectedErrorModes.length < 3) failures.push(`${tool.id} needs at least 3 expected error modes`);
  if (card.costClass !== tool.costClass) failures.push(`${tool.id} cost class mismatch`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(card.lastUpdated)) failures.push(`${tool.id} lastUpdated must be YYYY-MM-DD`);
}

if (failures.length > 0) {
  console.error('Transparency card audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Transparency card audit passed for ${MARKETPLACE_TOOLS.length} marketplace tools.`);

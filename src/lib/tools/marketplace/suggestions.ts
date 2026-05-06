import type { CaseModule } from '@/types/case-module';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';
import { getOntologyForDomain } from '@/lib/ontology/registry';
import type { OntologyId } from '@/lib/ontology/types';

export interface ToolSuggestion {
  tool: MarketplaceToolDefinition;
  score: number;
  rationale: string;
}

export function rankMarketplaceToolsForCase(
  tools: MarketplaceToolDefinition[],
  caseModule: CaseModule,
): ToolSuggestion[] {
  const ontology = getOntologyForDomain(caseModule.manifest.domain);
  const contextHealth =
    (caseModule.truthLayers.source.provenanceCoverage +
      caseModule.truthLayers.claim.provenanceCoverage +
      caseModule.truthLayers.evidence.provenanceCoverage +
      caseModule.truthLayers.verdict.provenanceCoverage) / 4;

  return tools
    .map((tool) => {
      const ontologyFit = tool.ontologyRequirements.includes(ontology.id) ? 40 : tool.category === 'cross' ? 20 : 0;
      const healthFit = contextHealth >= tool.minContextHealth ? 25 : Math.max(0, 15 - ((tool.minContextHealth - contextHealth) * 100));
      const costFit = tool.costClass === 'low' ? 15 : tool.costClass === 'medium' ? 8 : 3;
      const runtimeFit = tool.estimatedRuntimeMs <= 15000 ? 10 : 5;
      const gracefulFit = tool.contextSpec.graceful ? 10 : 0;
      const score = Math.round(ontologyFit + healthFit + costFit + runtimeFit + gracefulFit);
      return {
        tool,
        score,
        rationale: buildRationale(tool, ontology.id, contextHealth),
      };
    })
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
}

function buildRationale(tool: MarketplaceToolDefinition, ontologyId: OntologyId, contextHealth: number): string {
  const reasons = [];
  if (tool.ontologyRequirements.includes(ontologyId)) reasons.push(`fits ${ontologyId} ontology`);
  if (tool.contextSpec.graceful) reasons.push('runs with advisory context');
  if (contextHealth < tool.minContextHealth) reasons.push('AI assist can fill thin context');
  if (tool.subagentDeps.length) reasons.push(`uses ${tool.subagentDeps.join(', ')}`);
  return reasons.join('; ');
}

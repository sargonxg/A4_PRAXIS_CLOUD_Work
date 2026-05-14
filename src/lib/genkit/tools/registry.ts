import { z } from 'genkit';
import { ai } from '@/lib/genkit';
import { PATH_SEEDS } from '@/lib/path/seeds';
import { isPathId, type PathId } from '@/lib/path/types';
import { getCanonicalAttachableTool } from '@/lib/tools/canonical';

export const GENKIT_TOOL_MAX_TURNS = 8 as const;

const interruptToolIds = new Set(['brief_builder', 'redline_finder']);

const ToolInputSchema = z.object({
  prompt: z.string().min(1).describe('Analyst request or focused subtask for this tool.'),
  pathId: z.string().optional().describe('PRAXIS Path Core id when the tool is path-scoped.'),
  situationId: z.string().optional().describe('Current Situation Core id.'),
  capsuleId: z.string().optional().describe('Current capsule id.'),
  context: z.record(z.string(), z.any()).optional().describe('Small structured context needed for the tool run.'),
});

const ToolOutputSchema = z.object({
  toolId: z.string(),
  route: z.string().nullable(),
  status: z.enum(['ready', 'needs-ui-confirmation', 'routed']),
  summary: z.string(),
  prompt: z.string(),
  pathId: z.string().nullable(),
  requiresConfirmation: z.boolean(),
});

type ToolDefinition = {
  id: string;
  pathBundleId: string;
  description: string;
  route?: string;
  canonicalToolId?: string;
  requiresConfirmation?: boolean;
};

const toolDefinitions: ToolDefinition[] = [
  {
    id: 'actor_map',
    pathBundleId: 'actor-map',
    canonicalToolId: 'stakeholder-map',
    description: 'Maps actors, relationships, power, alignment, and salience for the active situation.',
  },
  {
    id: 'escalation_monitor',
    pathBundleId: 'escalation-monitor',
    route: '/api/ai/escalation-scan',
    description: 'Scans near-term escalation indicators, triggers, thresholds, and warning signs.',
  },
  {
    id: 'scenario_tree',
    pathBundleId: 'scenario-tree',
    canonicalToolId: 'scenario-projector',
    description: 'Builds best, likely, and worst scenario branches with indicators and assumptions.',
  },
  {
    id: 'brief_builder',
    pathBundleId: 'brief-builder',
    route: '/api/ai/brief-builder',
    requiresConfirmation: true,
    description: 'Prepares a principal-ready brief outline or handover draft from the current capsule.',
  },
  {
    id: 'leverage_map',
    pathBundleId: 'leverage-map',
    canonicalToolId: 'position-vs-interest',
    description: 'Identifies leverage sources, constraints, incentives, and negotiation pressure points.',
  },
  {
    id: 'redline_finder',
    pathBundleId: 'redline-finder',
    canonicalToolId: 'contradiction-finder',
    requiresConfirmation: true,
    description: 'Finds red lines, legal/political constraints, and claims that need explicit review.',
  },
  {
    id: 'needs_assessment',
    pathBundleId: 'needs-assessment',
    route: '/api/ai/humanitarian',
    description: 'Assesses humanitarian needs, access constraints, protection issues, and response priorities.',
  },
  {
    id: 'narrative_map',
    pathBundleId: 'narrative-map',
    canonicalToolId: 'frame-narrative',
    description: 'Maps narratives, frames, legitimacy claims, and information-environment dynamics.',
  },
  {
    id: 'attribution_graph',
    pathBundleId: 'attribution-graph',
    route: '/api/ai/media-analyze',
    description: 'Builds attribution hypotheses and confidence notes for information or cyber events.',
  },
  {
    id: 'source_search',
    pathBundleId: 'source-search',
    canonicalToolId: 'grounded-research',
    description: 'Searches for grounded sources and returns source gaps, receipts, and provenance hints.',
  },
  {
    id: 'claim_extract',
    pathBundleId: 'claim-extract',
    route: '/api/ai/research-extract',
    description: 'Extracts claims, evidence spans, and source-linked facts from supplied material.',
  },
  {
    id: 'fact_check',
    pathBundleId: 'fact-check',
    canonicalToolId: 'contradiction-finder',
    description: 'Checks a claim against attached sources and identifies unsupported or conflicting evidence.',
  },
  {
    id: 'access_map',
    pathBundleId: 'access-map',
    route: '/api/ai/humanitarian',
    description: 'Maps access constraints, corridors, blocked populations, and operational blockers.',
  },
  {
    id: 'ipc_tracker',
    pathBundleId: 'ipc-tracker',
    route: '/api/ai/humanitarian',
    description: 'Tracks food-security and IPC-related signals for humanitarian response planning.',
  },
  {
    id: 'violation_log',
    pathBundleId: 'violation-log',
    route: '/api/ai/human-rights',
    description: 'Logs alleged violations, evidentiary posture, affected groups, and legal framing.',
  },
  {
    id: 'accountability_map',
    pathBundleId: 'accountability-map',
    route: '/api/ai/human-rights',
    description: 'Maps accountability venues, actors, evidence needs, and protection risks.',
  },
  {
    id: 'witness_graph',
    pathBundleId: 'witness-graph',
    route: '/api/ai/human-rights',
    description: 'Structures witness, document, and corroboration relationships without exposing sensitive identities.',
  },
  {
    id: 'institution_map',
    pathBundleId: 'institution-map',
    route: '/api/ai/power-map',
    description: 'Maps institutions, mandates, legitimacy, reform constraints, and veto points.',
  },
  {
    id: 'reform_tracker',
    pathBundleId: 'reform-tracker',
    route: '/api/ai/timeline-events',
    description: 'Tracks reform commitments, sequencing, deadlines, and implementation risks.',
  },
  {
    id: 'legitimacy_gauge',
    pathBundleId: 'legitimacy-gauge',
    route: '/api/ai/risk-assessment',
    description: 'Assesses legitimacy signals and contested authority across constituencies.',
  },
  {
    id: 'leverage_stack',
    pathBundleId: 'leverage-stack',
    route: '/api/ai/sanctions-scan',
    description: 'Stacks economic, financial, diplomatic, and institutional leverage options.',
  },
  {
    id: 'secondary_effects',
    pathBundleId: 'secondary-effects',
    route: '/api/ai/economic-impact',
    description: 'Estimates second-order effects, blowback, distributional exposure, and mitigation needs.',
  },
  {
    id: 'compliance_map',
    pathBundleId: 'compliance-map',
    route: '/api/ai/sanctions-check',
    description: 'Maps compliance constraints, legal exposure, carve-outs, and implementation posture.',
  },
  {
    id: 'program_fit',
    pathBundleId: 'program-fit',
    route: '/api/ai/risk-assessment',
    description: 'Checks development program fit against context, risks, partners, and outcome logic.',
  },
  {
    id: 'theory_of_change',
    pathBundleId: 'theory-of-change',
    route: '/api/ai/advisory',
    description: 'Builds or critiques a theory of change with assumptions, risks, and indicators.',
  },
  {
    id: 'recovery_arc',
    pathBundleId: 'recovery-arc',
    route: '/api/ai/forecast',
    description: 'Projects recovery, stabilization, and institutional capacity trajectories.',
  },
  {
    id: 'risk_cascade',
    pathBundleId: 'risk-cascade',
    route: '/api/ai/risk-assessment',
    description: 'Maps cascading climate, environmental, displacement, and security risks.',
  },
  {
    id: 'displacement_arc',
    pathBundleId: 'displacement-arc',
    route: '/api/ai/geospatial',
    description: 'Assesses displacement trajectories, geography, vulnerability, and response constraints.',
  },
  {
    id: 'resource_conflict',
    pathBundleId: 'resource-conflict',
    route: '/api/ai/geospatial',
    description: 'Analyzes resource competition, environmental stress, and conflict interaction.',
  },
  {
    id: 'info_op_tracker',
    pathBundleId: 'info-op-tracker',
    route: '/api/ai/info-environment',
    description: 'Tracks information operations, narratives, channels, and attribution caveats.',
  },
  {
    id: 'network_map',
    pathBundleId: 'network-map',
    route: '/api/ai/power-map',
    description: 'Maps transnational networks, brokers, dependencies, and structural power.',
  },
  {
    id: 'choke_point_finder',
    pathBundleId: 'choke-point-finder',
    route: '/api/ai/power-map',
    description: 'Finds operational, financial, logistical, or institutional choke points.',
  },
  {
    id: 'illicit_flow_arc',
    pathBundleId: 'illicit-flow-arc',
    route: '/api/ai/external-actors',
    description: 'Maps illicit flow pathways, actors, chokepoints, and enforcement leverage.',
  },
];

const routeByDefinition = new Map(
  toolDefinitions.map((definition) => {
    const canonical = definition.canonicalToolId ? getCanonicalAttachableTool(definition.canonicalToolId) : null;
    return [definition.id, definition.route ?? canonical?.route ?? null] as const;
  }),
);

function pathForInput(pathId?: string | null) {
  return pathId && isPathId(pathId) ? PATH_SEEDS[pathId] : null;
}

const toolEntries = toolDefinitions.map((definition) => ({
  definition,
  tool: ai.defineTool(
    {
      name: definition.id,
      description: definition.description,
      inputSchema: ToolInputSchema,
      outputSchema: ToolOutputSchema,
    },
    async (input, { interrupt, resumed }) => {
      const requiresConfirmation = Boolean(definition.requiresConfirmation || interruptToolIds.has(definition.id));
      const resumedStatus =
        typeof resumed === 'object' && resumed !== null && 'status' in resumed ? resumed.status : undefined;
      if (requiresConfirmation && resumedStatus !== 'APPROVED') {
        interrupt({
          toolId: definition.id,
          message: `${definition.id} requires analyst confirmation before PRAXIS drafts or redline-sensitive material.`,
        });
      }

      const path = pathForInput(input.pathId);
      const route = routeByDefinition.get(definition.id) ?? null;
      const status: 'needs-ui-confirmation' | 'routed' = requiresConfirmation ? 'needs-ui-confirmation' : 'routed';
      return {
        toolId: definition.id,
        route,
        status,
        summary: `${definition.description}${path ? ` Path: ${path.name}.` : ''}`,
        prompt: input.prompt,
        pathId: path?.id ?? null,
        requiresConfirmation,
      };
    },
  ),
}));

export const praxisGenkitTools = toolEntries.map((entry) => entry.tool);

export const PRAXIS_GENKIT_TOOL_IDS = toolDefinitions.map((definition) => definition.id);
export const PRAXIS_GENKIT_PATH_TOOL_IDS = toolDefinitions.map((definition) => definition.pathBundleId);

export function toolIdFromPathBundleId(pathBundleId: string): string {
  return pathBundleId.replaceAll('-', '_');
}

export function getToolsForPath(pathId: PathId) {
  const path = PATH_SEEDS[pathId];
  const allowed = new Set(path.toolBundle.map(toolIdFromPathBundleId));
  return toolEntries.filter((entry) => allowed.has(entry.definition.id)).map((entry) => entry.tool);
}

export function getRegisteredToolForPathBundle(pathBundleId: string) {
  const toolId = toolIdFromPathBundleId(pathBundleId);
  return toolEntries.find((entry) => entry.definition.id === toolId)?.tool ?? null;
}

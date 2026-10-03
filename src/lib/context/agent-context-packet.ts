import { TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { getOntology } from '@/lib/ontology/registry';
import { validateOntologyReadiness } from '@/lib/ontology/validator-pass-rate';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cognitiveContextForCapsule } from '@/lib/cognitive-capsule/context-adapter';
import type { ContextCompilationReceipt } from '@/lib/cognitive-capsule/compiler';
import {
  buildTemporalTimeline,
  isTemporalIntent,
  type TemporalTimeline,
} from '@/lib/context/temporal-timeline';
import {
  agentContextBudgetForTier,
  capCausalConfidence,
  getActiveOntologyIds,
  selectAgentContextSubgraph,
  type AgentContextBudgetTier,
  type AgentContextSelectionResult,
  type NormalizedClaimCard,
  type NormalizedGraphNode,
  type NormalizedSourceReceipt,
  type OmittedContextItem,
  type ReasoningPath,
  type SelectedAgentContext,
} from '@/lib/context/agent-context-salience';

export type { AgentContextBudgetTier } from '@/lib/context/agent-context-salience';

export interface BuildAgentContextPacketInput {
  capsule: PraxisCapsule;
  userQuery?: string | null;
  budgetTier: AgentContextBudgetTier;
  requestTime: string;
  turnId?: string | null;
  temporalIntent?: boolean;
  includeCognition?: boolean;
}

export interface AgentContextGroundingMap {
  nodes: Record<string, string>;
  edges: Record<string, string>;
  claims: Record<string, string>;
  sources: Record<string, string>;
  paths: Record<string, string[]>;
}

export interface AgentContextPacketResult {
  cognitiveReceipt?: ContextCompilationReceipt;
  packetText: string;
  selected: SelectedAgentContext;
  omitted: OmittedContextItem[];
  groundingMap: AgentContextGroundingMap;
  temporalTimeline: TemporalTimeline;
}

interface RenderContext {
  nodeIds: Map<string, string>;
  edgeIds: Map<string, string>;
  claimIds: Map<string, string>;
  sourceIds: Map<string, string>;
}

const PACKET_HEADER = '## PRAXIS Agent Context Graph Packet v1';
const DISABLE_VALUES = new Set(['0', 'false', 'off', 'disabled', 'no']);

export function shouldEnableAgentContextPacket(value: string | undefined): boolean {
  if (value === undefined || value.trim() === '') return true;
  return !DISABLE_VALUES.has(value.trim().toLowerCase());
}

export function buildAgentContextPacket(input: BuildAgentContextPacketInput): AgentContextPacketResult {
  const temporalIntent = input.temporalIntent ?? isTemporalIntent(input.userQuery);
  const selection = selectAgentContextSubgraph({
    capsule: input.capsule,
    userQuery: input.userQuery,
    budgetTier: input.budgetTier,
    requestTime: input.requestTime,
    temporalIntent,
  });
  const selected = enforceRenderedTokenBudget(selection, { ...input, temporalIntent });
  const render = buildRenderContext(selected);
  const groundingMap = buildGroundingMap(selected, render);
  const temporalTimeline = buildTemporalTimeline({
    capsule: input.capsule,
    requestTime: input.requestTime,
  });
  const basePacket = renderPacket({ ...input, temporalIntent }, selected, render, temporalTimeline);
  const remainingChars = Math.max(0, agentContextBudgetForTier(input.budgetTier).maxTokens * 4 - basePacket.length - 1);
  const cognitive = input.includeCognition === false ? { text: '' } : cognitiveContextForCapsule(input.capsule, { objective: input.userQuery ?? undefined, asOf: input.requestTime, maxChars: Math.min(6000, remainingChars) });
  const renderInput = { ...input, cognitiveText: cognitive.text };
  return {
    packetText: renderPacket({ ...renderInput, temporalIntent }, selected, render, temporalTimeline),
    ...(cognitive.view ? { cognitiveReceipt: cognitive.view.receipt } : {}),
    selected,
    omitted: selected.omitted,
    groundingMap,
    temporalTimeline,
  };
}

export function appendAgentContextPacketToPromptBlock(input: BuildAgentContextPacketInput & {
  promptBlock: string;
  envValue?: string;
}): { promptBlock: string; packet?: AgentContextPacketResult } {
  if (!shouldEnableAgentContextPacket(input.envValue ?? process.env.PRAXIS_AGENT_CONTEXT_PACKET)) {
    return { promptBlock: input.promptBlock };
  }
  const packet = buildAgentContextPacket(input);
  return {
    promptBlock: [
      input.promptBlock.trimEnd(),
      '',
      '<praxis-agent-context-graph-packet>',
      packet.packetText,
      '</praxis-agent-context-graph-packet>',
    ].join('\n'),
    packet,
  };
}

function renderPacket(
  input: BuildAgentContextPacketInput & { cognitiveText?: string },
  selection: AgentContextSelectionResult,
  render: RenderContext,
  temporalTimeline: TemporalTimeline,
): string {
  const capsule = input.capsule;
  const temporality = capsuleTemporality(capsule);
  const budget = agentContextBudgetForTier(input.budgetTier);
  const body = [
    PACKET_HEADER,
    `packet_id: capsule:${capsule.capsuleId}:turn:${clean(input.turnId) || 'unknown'}:graph-packet-v1`,
    `capsule: ${capsule.capsuleId} v${capsule.version}`,
    `as_of: ${temporality.asOf ?? input.requestTime}`,
    `query: ${shorten(clean(input.userQuery), 1000) || 'none'}`,
    `budget: ${estimateTokens(renderSelectionBody(selection, render))}/${budget.maxTokens}`,
    'canonical_store: Firestore ContextCapsules',
    'advisory_policy: advisory graph rows require review before promotion',
    '',
    renderTaskLens(capsule, input.userQuery),
    renderOntologyContract(capsule, selection),
    renderSalienceLedger(selection),
    renderSourceReceiptIndex(selection.sources, render),
    renderClaimCards(selection.claims, render),
    renderIncidentNeighborhoods(selection, render),
    renderReasoningPaths(selection.paths, selection, render),
    renderTemporalFrame(capsule, selection, input.requestTime, render, temporalTimeline, Boolean(input.temporalIntent)),
    renderCausalChains(selection, render),
    input.cognitiveText ?? '',
    renderAgentUseInstructions(),
  ].join('\n');
  return body;
}

function renderSelectionBody(selection: AgentContextSelectionResult, render: RenderContext): string {
  return [
    renderSalienceLedger(selection),
    renderSourceReceiptIndex(selection.sources, render),
    renderClaimCards(selection.claims, render),
    renderIncidentNeighborhoods(selection, render),
    renderReasoningPaths(selection.paths, selection, render),
    renderCausalChains(selection, render),
  ].join('\n');
}

function renderTaskLens(capsule: PraxisCapsule, userQuery?: string | null): string {
  const query = clean(userQuery).toLowerCase();
  const answerMode = /\b(draft|memo|brief|write)\b/.test(query)
    ? 'draft'
    : /\b(review|check|audit|verify)\b/.test(query)
      ? 'review'
      : /\b(scenario|forecast|simulate)\b/.test(query)
        ? 'scenario'
        : 'ask';
  const highStakes = [
    /\blegal|law|court|treaty|sanction\b/.test(query) ? 'legal' : '',
    /\bsecurity|conflict|military|violence\b/.test(query) ? 'security' : '',
    /\bfinancial|budget|market|investment\b/.test(query) ? 'financial' : '',
  ].filter(Boolean);
  const output = capsule.coreRefs.outputCoreIds.length ? capsule.coreRefs.outputCoreIds.join(', ') : 'answer';
  return [
    '### 1. Task Lens',
    `- user_intent: ${query ? classifyIntent(query) : 'answer_from_capsule'}`,
    `- answer_mode: ${answerMode}`,
    `- required_output: ${output}`,
    `- high_stakes_flags: ${highStakes.length ? highStakes.join(', ') : 'none'}`,
    '',
  ].join('\n');
}

function renderOntologyContract(capsule: PraxisCapsule, selection: AgentContextSelectionResult): string {
  const ontologyIds = selection.activeOntologyIds.length ? selection.activeOntologyIds : getActiveOntologyIds(capsule);
  const ontologies = ontologyIds.map(getOntology);
  const nodeTypes = uniqueBy(ontologies.flatMap((ontology) => ontology.nodeTypes), (node) => node.id);
  const edgeTypes = uniqueBy(ontologies.flatMap((ontology) => ontology.edgeTypes), (edge) => edge.id);
  const readiness = validateOntologyReadiness({
    ontologyIds,
    nodes: selection.nodes.map((node) => ({
      id: node.id,
      primitive: node.primitive,
      entityType: node.entityType,
      label: node.label,
      validAt: node.validFrom,
      sourceReceiptIds: node.sourceReceiptIds,
      usedInAnswer: selection.claims.some((claim) => claim.linkedNodeIds.includes(node.id)),
      reviewState: node.reviewState,
    })),
    edges: selection.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationshipType: edge.relationshipType,
      sourceReceiptIds: edge.sourceReceiptIds,
      reviewState: edge.reviewState,
      confidence: edge.confidence,
      directlySourceStated: edge.directlySourceStated,
    })),
  });
  const validatorLines = readiness.issues.length
    ? readiness.issues.slice(0, 8).map((issue) => `- ${issue.validatorId}: ${issue.severity}; ${issue.message}`)
    : ontologies.flatMap((ontology) => ontology.validators.slice(0, 2).map((validator) => `- ${validator.id}: ${validator.severity}; ${validator.description}`)).slice(0, 8);
  return [
    '### 2. Active Ontology Contract',
    `core_primitives: ${TACITUS_CORE_PRIMITIVES.join(', ')}`,
    `active_ontology_ids: ${uniqueStrings([...ontologyIds, ...selection.ontologyStackIds]).join(', ')}`,
    `work_ontology_id: ${workOntologyId(capsule) ?? 'none'}`,
    'allowed_node_types:',
    ...nodeTypes.slice(0, 20).map((node) => `- ${node.id} -> primitive=${node.primitive}; description=${shorten(node.description, 130)}`),
    'allowed_edge_types:',
    ...edgeTypes.slice(0, 28).map((edge) => `- ${edge.id}: ${edge.from.join('|')} -> ${edge.to.join('|')}; semantics=${shorten(edge.description, 130)}`),
    'validators:',
    ...(validatorLines.length ? validatorLines : ['- none: info; no active ontology validators reported issues']),
    'extension_policy: off-schema rows are proposals, not facts',
    '',
  ].join('\n');
}

function renderSalienceLedger(selection: AgentContextSelectionResult): string {
  const lines = [
    '### 3. Salience Ledger',
    'selection_policy: query_similarity + ontology_fit + path_utility + source_quality + confidence + recency + coverage',
    `selected_counts: nodes=${selection.nodes.length}; edges=${selection.edges.length}; claims=${selection.claims.length}; sources=${selection.sources.length}; omitted=${selection.omitted.length}`,
    'omitted_context:',
  ];
  if (!selection.omitted.length) {
    lines.push('- none: reason=none');
  } else {
    for (const item of selection.omitted.slice(0, 24)) {
      lines.push(`- ${item.id}: reason=${item.reason}; kind=${item.kind}; detail=${shorten(item.detail, 120)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderSourceReceiptIndex(sources: NormalizedSourceReceipt[], render: RenderContext): string {
  const lines = ['### 4. Source Receipt Index'];
  if (!sources.length) {
    lines.push('no source receipts selected.');
  } else {
    for (const source of sources) {
      const id = render.sourceIds.get(source.id) ?? source.id;
      lines.push(`[${id}] title=${source.title}; url=${source.url ?? 'none'}; date=${source.date ?? 'unknown'}; tier=${source.reliabilityTier ?? 'unknown'}; freshness=${source.stale ? 'stale' : source.date ? 'fresh' : 'unknown'}; trust=${source.trust ?? 'unknown'}`);
      if (source.excerpt) lines.push(`excerpt: "${shorten(source.excerpt, 220)}"`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderClaimCards(claims: NormalizedClaimCard[], render: RenderContext): string {
  const lines = ['### 5. Claim Cards'];
  if (!claims.length) {
    lines.push('no claim cards selected.');
  } else {
    for (const claim of claims) {
      const id = render.claimIds.get(claim.id) ?? claim.id;
      const supports = formatIds(claim.sourceReceiptIds, render.sourceIds);
      const contradicts = formatIds(claim.contradicts, render.sourceIds);
      lines.push(`[${id}] text=${claim.text}`);
      lines.push(`type: ${claim.type}; status=${claim.status}; confidence=${formatConfidence(claim.confidence)}; kind=${claim.confidenceKind}`);
      lines.push(`valid_time: ${claim.validFrom ?? 'unknown'}..${claim.validTo ?? 'open'}; recorded_at=${claim.recordedAt ?? claim.asOf ?? 'unknown'}`);
      lines.push(`supports: ${supports}; contradicts: ${contradicts}`);
      lines.push(`linked_nodes: ${formatIds(claim.linkedNodeIds, render.nodeIds)}; linked_edges: ${formatIds(claim.linkedEdgeIds, render.edgeIds)}`);
      lines.push(`use_rule: ${claimUseRuleFor(claim)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderIncidentNeighborhoods(selection: AgentContextSelectionResult, render: RenderContext): string {
  const lines = ['### 6. Incident Neighborhoods'];
  if (!selection.nodes.length) {
    lines.push('no graph evidence yet: capsule has no selected embeddedGraph nodes or sourced graph rows.');
  } else {
    for (const node of selection.nodes) {
      const nodeId = render.nodeIds.get(node.id) ?? node.id;
      lines.push(`[${nodeId}] ${node.label} :: ${node.entityType}/${node.primitive}; status=${node.reviewState}; confidence=${formatConfidence(node.confidence)}; sources=${formatIds(node.sourceReceiptIds, render.sourceIds)}`);
      for (const edge of selection.edges.filter((item) => item.source === node.id).slice(0, 4)) {
        const edgeId = render.edgeIds.get(edge.id) ?? edge.id;
        const target = selection.nodes.find((item) => item.id === edge.target);
        lines.push(`  OUT ${edgeId} ${edge.relationshipType} -> ${formatNodeRef(edge.target, target, render)}; conf=${formatConfidence(edge.confidence)}; sources=${formatIds(edge.sourceReceiptIds, render.sourceIds)}; time=${edge.validFrom ?? 'unknown'}..${edge.validTo ?? 'open'}`);
      }
      for (const edge of selection.edges.filter((item) => item.target === node.id).slice(0, 4)) {
        const edgeId = render.edgeIds.get(edge.id) ?? edge.id;
        const source = selection.nodes.find((item) => item.id === edge.source);
        lines.push(`  IN  ${edgeId} ${edge.relationshipType} <- ${formatNodeRef(edge.source, source, render)}; conf=${formatConfidence(edge.confidence)}; sources=${formatIds(edge.sourceReceiptIds, render.sourceIds)}`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderReasoningPaths(paths: ReasoningPath[], selection: AgentContextSelectionResult, render: RenderContext): string {
  const lines = ['### 7. Reasoning Paths'];
  if (!paths.length) {
    lines.push('no reasoning paths selected.');
  } else {
    for (const [index, path] of paths.entries()) {
      const pathId = `P-${index + 1}`;
      const pathText = path.edgeIds.map((edgeId) => {
        const edge = selection.edges.find((item) => item.id === edgeId);
        if (!edge) return edgeId;
        const source = selection.nodes.find((item) => item.id === edge.source);
        const target = selection.nodes.find((item) => item.id === edge.target);
        return `${formatNodeRef(edge.source, source, render)} -> ${render.edgeIds.get(edge.id) ?? edge.id} ${edge.relationshipType} -> ${formatNodeRef(edge.target, target, render)}`;
      }).join(' | ');
      lines.push(`[${pathId}] purpose=${path.purpose}`);
      lines.push(pathText || path.nodeIds.map((id) => render.nodeIds.get(id) ?? id).join(' -> '));
      lines.push(`why_selected: ${path.whySelected}`);
      lines.push(`sources: ${formatIds(path.sourceReceiptIds, render.sourceIds)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function renderTemporalFrame(
  capsule: PraxisCapsule,
  selection: AgentContextSelectionResult,
  requestTime: string,
  render: RenderContext,
  temporalTimeline: TemporalTimeline,
  temporalIntent: boolean,
): string {
  const temporality = capsuleTemporality(capsule);
  const stale = [
    ...selection.nodes.filter((node) => node.validTo && Date.parse(node.validTo) < Date.parse(requestTime)).map((node) => node.id),
    ...selection.edges.filter((edge) => edge.validTo && Date.parse(edge.validTo) < Date.parse(requestTime)).map((edge) => edge.id),
  ];
  const lines = [
    '### 8. Temporal Frame',
    `query_time: ${requestTime}`,
    `capsule_as_of: ${temporality.asOf ?? 'unknown'}`,
    `valid_window: ${temporality.validFrom ?? 'unknown'}..${temporality.validUntil ?? 'open'}`,
    `timeline_mode: ${temporalIntent ? 'expanded_temporal_reasoning' : 'standard_temporal_frame'}`,
    `knowledge_product_shape: CapsuleTemporalViewerItem[] + ontology_edges`,
    'timeline:',
  ];
  if (!selection.timeline.length) {
    lines.push('- none: no timeline anchors selected.');
  } else {
    for (const [index, item] of selection.timeline.entries()) {
      const ids = [
        ...(item.nodeIds ?? []).map((id) => render.nodeIds.get(id) ?? id),
        ...(item.claimIds ?? []).map((id) => render.claimIds.get(id) ?? id),
      ];
      const grounding = item.sourceReceiptIds.length ? 'receipt_grounded' : item.advisory ? 'advisory_uncertain' : 'unknown';
      lines.push(`- [T-${index + 1}] ${item.date} ${item.kind}: ${item.label}; refs=${formatRawIds(ids)}; sources=${formatIds(item.sourceReceiptIds, render.sourceIds)}; valid=${item.validFrom ?? item.date}..${item.validTo ?? 'open'}; confidence=${formatConfidence(item.confidence)}; grounding=${grounding}`);
    }
  }
  lines.push('timeline_edges:');
  const selectedTimelineIds = new Set(selection.timeline.map((item) => item.id));
  const edges = temporalTimeline.edges.filter((edge) => selectedTimelineIds.has(edge.source) && selectedTimelineIds.has(edge.target));
  if (!edges.length) {
    lines.push('- none: no temporal or causal timeline edges selected.');
  } else {
    for (const edge of edges.slice(0, temporalIntent ? 24 : 8)) {
      lines.push(`- ${edge.source} -[${edge.relation}]-> ${edge.target}; sources=${formatIds(edge.sourceReceiptIds, render.sourceIds)}; confidence=${formatConfidence(edge.confidence)}; grounding=${edge.grounding}`);
    }
  }
  lines.push('stale_or_expired:');
  if (!stale.length) lines.push('- none: expired_at=none; action=none');
  else stale.forEach((id) => lines.push(`- ${id}: expired_at=before_query_time; action=verify_before_use`));
  lines.push('');
  return lines.join('\n');
}

function renderCausalChains(selection: AgentContextSelectionResult, render: RenderContext): string {
  const lines = ['### 9. Causal Chains'];
  if (!selection.causalLinks.length) {
    lines.push('no causal chains selected.');
  } else {
    selection.causalLinks.forEach((link, index) => {
      const capped = capCausalConfidence({ ...link, confidenceKind: 'ASSESSED' as const, reviewState: 'advisory' as const });
      const cause = render.nodeIds.get(link.cause) ?? render.claimIds.get(link.cause) ?? link.cause;
      const effect = render.nodeIds.get(link.effect) ?? render.claimIds.get(link.effect) ?? link.effect;
      lines.push(`[C-${index + 1}] relation=${link.relation}; confidence=${formatConfidence(capped.confidence)}`);
      lines.push(`cause=${cause}; effect=${effect}; evidence=${formatIds(link.evidenceRefs, render.sourceIds)}`);
      lines.push(`chain: ${cause} -> ${link.relation} -> ${effect}`);
      lines.push(`caveat: ${link.caveat ?? 'causal relation is assessed unless directly stated in cited receipts'}`);
    });
  }
  lines.push('');
  return lines.join('\n');
}

function renderAgentUseInstructions(): string {
  return [
    '### 10. Agent Use Instructions',
    '- Prefer canonical/reviewed, source-backed claims over advisory/inferred rows.',
    '- Cite source receipt IDs for any decision-relevant claim.',
    '- If evidence conflicts, state the conflict and cite both sides.',
    '- Treat missing ontology primitives as evidence gaps.',
    '- Do not promote advisory graph rows without a review-card path.',
    '- Label outside knowledge separately from capsule context.',
    '',
  ].join('\n');
}

function enforceRenderedTokenBudget(
  selection: AgentContextSelectionResult,
  input: BuildAgentContextPacketInput & { cognitiveText?: string },
): AgentContextSelectionResult {
  const budget = agentContextBudgetForTier(input.budgetTier);
  const temporalTimeline = buildTemporalTimeline({
    capsule: input.capsule,
    requestTime: input.requestTime,
  });
  let current: AgentContextSelectionResult = cloneSelection(selection);
  let render = buildRenderContext(current);
  while (estimateTokens(renderPacket(input, current, render, temporalTimeline)) > budget.maxTokens) {
    const removed = removeLeastUsefulRow(current);
    if (!removed) break;
    current = {
      ...current,
      omitted: [...current.omitted, removed],
    };
    render = buildRenderContext(current);
  }
  return current;
}

function removeLeastUsefulRow(selection: AgentContextSelectionResult): OmittedContextItem | null {
  if (selection.edges.length) {
    const row = selection.edges.pop();
    return row ? { id: row.id, kind: 'edge', reason: 'budget', detail: 'Removed to keep packet under hard token cap.' } : null;
  }
  if (selection.nodes.length) {
    const row = selection.nodes.pop();
    return row ? { id: row.id, kind: 'node', reason: 'budget', detail: 'Removed to keep packet under hard token cap.' } : null;
  }
  if (selection.claims.length) {
    const row = selection.claims.pop();
    return row ? { id: row.id, kind: 'claim', reason: 'budget', detail: 'Removed to keep packet under hard token cap.' } : null;
  }
  if (selection.sources.length) {
    const row = selection.sources.pop();
    return row ? { id: row.id, kind: 'source', reason: 'budget', detail: 'Removed to keep packet under hard token cap.' } : null;
  }
  return null;
}

function buildRenderContext(selection: SelectedAgentContext): RenderContext {
  return {
    nodeIds: sequentialIds(selection.nodes.map((node) => node.id), 'N'),
    edgeIds: sequentialIds(selection.edges.map((edge) => edge.id), 'E'),
    claimIds: sequentialIds(selection.claims.map((claim) => claim.id), 'CL'),
    sourceIds: sequentialIds(selection.sources.map((source) => source.id), 'SR'),
  };
}

function buildGroundingMap(selection: SelectedAgentContext, render: RenderContext): AgentContextGroundingMap {
  return {
    nodes: invertMap(render.nodeIds),
    edges: invertMap(render.edgeIds),
    claims: invertMap(render.claimIds),
    sources: invertMap(render.sourceIds),
    paths: Object.fromEntries(selection.paths.map((path, index) => [`P-${index + 1}`, [...path.nodeIds, ...path.edgeIds, ...path.sourceReceiptIds]])),
  };
}

function sequentialIds(ids: string[], prefix: string): Map<string, string> {
  return new Map(ids.map((id, index) => [id, `${prefix}-${index + 1}`]));
}

function invertMap(map: Map<string, string>): Record<string, string> {
  return Object.fromEntries(Array.from(map.entries()).map(([original, display]) => [display, original]));
}

function cloneSelection(selection: AgentContextSelectionResult): AgentContextSelectionResult {
  return {
    ...selection,
    nodes: [...selection.nodes],
    edges: [...selection.edges],
    claims: [...selection.claims],
    sources: [...selection.sources],
    paths: [...selection.paths],
    timeline: [...selection.timeline],
    causalLinks: [...selection.causalLinks],
    omitted: [...selection.omitted],
  };
}

function capsuleTemporality(capsule: PraxisCapsule): { asOf: string | null; validFrom: string | null; validUntil: string | null } {
  const grounding = firstRecord(firstRecord(capsule.v3)?.grounding);
  const temporality = firstRecord(capsule.temporality, grounding?.temporality);
  return {
    asOf: nullableString(temporality?.asOf),
    validFrom: nullableString(temporality?.validFrom),
    validUntil: nullableString(temporality?.validUntil),
  };
}

function classifyIntent(query: string): string {
  if (/\b(cause|caused|why|effect|impact)\b/.test(query)) return 'causal_analysis';
  if (/\b(compare|versus|tradeoff|conflict|contradict)\b/.test(query)) return 'comparison_or_conflict_review';
  if (/\b(draft|memo|brief|write)\b/.test(query)) return 'draft_grounded_output';
  if (/\b(review|audit|verify|source)\b/.test(query)) return 'sourceability_review';
  return 'answer_from_capsule';
}

function claimUseRuleFor(claim: NormalizedClaimCard): string {
  const confidence = claim.confidence ?? 0;
  if (confidence < 0.75 || (claim.status !== 'canonical' && claim.status !== 'reviewed')) {
    return 'cite when used; qualify because confidence < 0.75 or status is not canonical/reviewed';
  }
  return 'cite when used';
}

function formatNodeRef(id: string, node: NormalizedGraphNode | undefined, render: RenderContext): string {
  const display = render.nodeIds.get(id) ?? id;
  return node ? `${display} ${node.label}` : display;
}

function formatIds(ids: string[], map: Map<string, string>): string {
  if (!ids.length) return '[]';
  return `[${ids.map((id) => map.get(id) ?? id).join(', ')}]`;
}

function formatRawIds(ids: string[]): string {
  if (!ids.length) return '[]';
  return `[${ids.join(', ')}]`;
}

function formatConfidence(value: number | null | undefined): string {
  return typeof value === 'number' ? value.toFixed(2) : 'unknown';
}

function estimateTokens(value: string): number {
  return Math.ceil(value.length / 4);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown): string | null {
  const cleaned = clean(value);
  return cleaned || null;
}

function workOntologyId(capsule: PraxisCapsule): string | null {
  const starter = firstRecord(capsule.starterSnapshot);
  const overlay = firstRecord(starter?.ontologyOverlay);
  return nullableString(overlay?.workOntologyId);
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
}

function shorten(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, Math.max(0, max - 3))}...`;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = value?.trim();
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const id = key(value);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(value);
  }
  return result;
}

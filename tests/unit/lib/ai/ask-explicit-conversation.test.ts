import { describe, expect, it } from 'vitest';
import { classifyAskIntent, type AskContextReceipt } from '@/lib/ai/ask-conversation';
import { buildTacitusRoutingDecision } from '@/lib/ai/tacitus-routing-policy';
import { buildAskConversationOrchestrationReceipt } from '@/lib/ai/ask-orchestrator';
import { buildWorkIntentPlan } from '@/lib/ai/work-intent-router';
import { filterAskToolsForExecution, readAskMessages, resolveAskExecutionPreference } from '@/lib/ai/ask-execution-preference';

const directPrompts = [
  'This is synthetic QA only. For our direct conversation, remember test code QA-HOME-ABC and review deadline 2026-11-12. Restate the supplied code and deadline briefly. Do not browse, use research tools or dispatch agents.',
  'From the attached saved ContextCapsule, restate the code, deadline, and audit condition for the brief. Do not browse or dispatch agents.',
  'Write a brief from the supplied context only. Do not queue agents or use external tools.',
  'What test code and deadline did I supply in the previous turn? Answer using only this direct conversation, without browsing or agent runs. Synthetic acceptance turn ABC-2.',
  'From the attached synthetic capsule purpose, what project code, review deadline and pre-launch condition were supplied? Distinguish supplied context from verified evidence. Answer briefly, without browsing or agent runs.',
  'What test code and review deadline did I give in the previous turn? Use only this conversation; answer briefly without browsing or agent runs.',
  'What had to happen before public launch, and what remained undecided in our previous synthetic context? Use this capsule and the earlier exchange only; no browsing or agent runs.',
];

describe('explicit Ask conversation restrictions', () => {
  it('lets calibration inspect malformed raw messages safely before schema validation rejects them', () => {
    const malformed = [null, 'not a message', {}, { role: null, content: 'invalid' }];
    expect(readAskMessages(malformed)).toEqual([]);
    const messages = readAskMessages([...malformed, { role: 'user', content: directPrompts[0] }, null]);
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    expect(resolveAskExecutionPreference(String(lastUser?.content))).toMatchObject({ preferDirectAnswer: true, allowExternalSources: false });
    expect(malformed).toHaveLength(4);
  });
  it.each(directPrompts)('keeps the requested direct conversation in chat: %s', (prompt) => {
    const intent = classifyAskIntent(prompt);
    const routing = buildTacitusRoutingDecision({ prompt, intent, capsuleHealth: 'ready', sourcePreviewCount: 0, activeGapCount: 0 });
    const receipt = buildAskConversationOrchestrationReceipt({ prompt, intent, contextReceipt, sourcePreviewCount: 0 });
    expect(intent).toBe('normal_answer');
    expect(resolveAskExecutionPreference(prompt)).toMatchObject({ preferDirectAnswer: true, allowExternalSources: false, allowWorkspaceRetrieval: false });
    expect(routing.workerMode).toBe('direct-answer');
    expect(routing.toolRoute.selectedToolIds).toEqual(['context-resolve', 'capsule-evidence-pack']);
    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.generationBudget.mode).toBe('standard');
    expect(receipt.workflowPlan.requiredPolicyAgentIds).toEqual([]);
    expect(receipt.turnPlan.requiredAgents).toEqual([]);
    expect(receipt.turnPlan.continuationPolicy).not.toBe('queue_agent');
    expect(buildWorkIntentPlan({ prompt }).intent).toBe('general_answer');
  });

  it('keeps positive deep research working', () => {
    const prompt = 'Research the latest official sources and prepare a deep multi-source policy memo.';
    const routing = buildTacitusRoutingDecision({ prompt, intent: classifyAskIntent(prompt), capsuleHealth: 'thin', sourcePreviewCount: 0, activeGapCount: 1 });
    expect(routing.workerMode).toBe('research-memo');
    expect(routing.toolRoute.selectedToolIds).toContain('grounded-search');
  });

  it.each([directPrompts[3], directPrompts[5]])('keeps conversation-only follow-ups free of workspace retrieval: %s', (prompt) => {
    const preference = resolveAskExecutionPreference(prompt);
    expect(preference).toMatchObject({ preferDirectAnswer: true, suppliedContextOnly: true, allowExternalSources: false, allowWorkspaceRetrieval: false });
    expect(filterAskToolsForExecution({ webSearch: {}, runDeepResearch: {}, analyzeDocument: {} }, preference)).toEqual({});
  });

  it('keeps a manual research agent local when browsing is prohibited', () => {
    const prompt = 'Prepare a research memo from the attached sources. Do not browse.';
    const routing = buildTacitusRoutingDecision({ prompt, intent: classifyAskIntent(prompt), selectedPolicyAgentId: 'research-memo', capsuleHealth: 'ready', sourcePreviewCount: 2, activeGapCount: 0 });
    expect(routing.workerMode).toBe('research-memo');
    expect(routing.toolRoute.selectedToolIds).not.toContain('grounded-search');
    expect(routing.toolRoute.selectedToolIds).not.toContain('deep-search-agent');
  });

  it('allows grounding for a direct answer when only agent dispatch is prohibited', () => {
    const prompt = 'Find current official sources about access restrictions. Do not dispatch agents.';
    const routing = buildTacitusRoutingDecision({ prompt, intent: classifyAskIntent(prompt), capsuleHealth: 'thin', sourcePreviewCount: 0, activeGapCount: 1 });
    expect(routing.workerMode).toBe('direct-answer');
    expect(routing.toolRoute.selectedToolIds).toContain('grounded-search');
    expect(routing.toolRoute.selectedToolIds).not.toContain('deep-search-agent');
  });

  it('enforces no-agent constraints on the actual named streaming tools while preserving web grounding', () => {
    const tools = { webSearch: {}, groundedSearchFetch: {}, runDeepResearch: {}, writeToTool: {}, proposeGraphDelta: {}, analyzeDocument: {} };
    const filtered = filterAskToolsForExecution(tools, resolveAskExecutionPreference('Find current official sources. Do not dispatch agents.'));
    expect(Object.keys(filtered)).toEqual(['webSearch', 'groundedSearchFetch', 'analyzeDocument']);
    expect(filterAskToolsForExecution(tools, resolveAskExecutionPreference(directPrompts[0]))).toEqual({});
  });

  it('lets hard no-agent instructions override stale manual/Deep Research selection', () => {
    const prompt = 'Write a brief from supplied context. Do not dispatch agents.';
    const receipt = buildAskConversationOrchestrationReceipt({ prompt, intent: 'research_memo', selectedPolicyAgentId: 'research-memo', contextReceipt, sourcePreviewCount: 0 });
    expect(receipt.triage.intent).toBe('normal_answer');
    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.workflowPlan.requiredPolicyAgentIds).toEqual([]);
  });

  it('keeps supplied-only local research from reading the fallback sample graph', () => {
    const preference = resolveAskExecutionPreference('Research using only the attached documents.');
    expect(preference).toMatchObject({ preferDirectAnswer: false, allowExternalSources: false, allowWorkspaceRetrieval: false });
    const tools = { analyzeDocument: {}, queryConflictGraph: {}, groundedSearchFetch: {}, runDeepResearch: {} };
    expect(Object.keys(filterAskToolsForExecution(tools, preference))).toEqual(['analyzeDocument']);
  });

  it.each([
    'Research the effect of the quoted instruction "Do not browse or dispatch agents" on policy teams.',
    "Research the effect of the quoted instruction 'Do not browse or dispatch agents' on policy teams.",
    'Explain why some research tools do not browse and why agents should respect restrictions.',
    'Research how teams answer without browsing and how agent runs affect accountability.',
  ])('does not turn quoted instructions or conceptual mentions into restrictions: %s', (prompt) => {
    expect(resolveAskExecutionPreference(prompt)).toMatchObject({ preferDirectAnswer: false, allowTools: true, allowExternalSources: true });
  });

  it('keeps an affirmative local research request after a contrasting browse prohibition', () => {
    const prompt = 'Do not browse, but research the attached documents for a memo.';
    const preference = resolveAskExecutionPreference(prompt);
    expect(preference).toMatchObject({ preferDirectAnswer: false, allowTools: true, allowExternalSources: false });
    expect(classifyAskIntent(prompt)).toBe('research_memo');
  });

  it('keeps deliberate local research available without external tools', () => {
    const prompt = 'Research the attached documents without external tools.';
    expect(resolveAskExecutionPreference(prompt)).toMatchObject({ preferDirectAnswer: false, allowTools: true, allowExternalSources: false });
    const routing = buildTacitusRoutingDecision({ prompt, intent: classifyAskIntent(prompt), selectedPolicyAgentId: 'research-memo', capsuleHealth: 'ready', sourcePreviewCount: 1, activeGapCount: 0 });
    expect(routing.workerMode).toBe('research-memo');
    expect(routing.toolRoute.selectedToolIds).not.toContain('grounded-search');
  });
});

const contextReceipt: AskContextReceipt = {
  capsuleId: 'saved-capsule', capsuleVersion: 1, threadId: 'thread-a', traceId: 'trace-a', health: 'ready',
  coreRefs: { userCoreId: null, situationCoreId: null, sourceDocumentCoreIds: [], graphCoreId: null, memoryCoreId: null, outputCoreIds: [] },
  retrievalLayers: [], referenceCapsuleIds: [], referenceCapsuleCount: 0, missingReferenceCapsuleIds: [],
  evidenceCount: 0, historyTurnCount: 0, memoryPersistence: 'firestore', warnings: [], stages: [],
};

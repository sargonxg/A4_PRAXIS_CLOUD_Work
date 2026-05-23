import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const conversationHelperSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-workbench-conversation.ts'), 'utf8');
const source = `${workbenchSource}\n${conversationHelperSource}`;
const instrumentSource = readFileSync(join(process.cwd(), 'src/components/ui/instrument.tsx'), 'utf8');
const visualSource = `${workbenchSource}\n${instrumentSource}`;
const sidebarSource = readFileSync(join(process.cwd(), 'src/components/app/app-sidebar.tsx'), 'utf8');
const primaryNavSource = readFileSync(join(process.cwd(), 'src/lib/navigation/primary-nav.ts'), 'utf8');
const repositoryPageSource = readFileSync(join(process.cwd(), 'src/app/app/repository/page.tsx'), 'utf8');
const routeSource = readFileSync(join(process.cwd(), 'src/app/app/capsules/page.tsx'), 'utf8');

function extractSourceBlock(start: string, end: string): string {
  const startIndex = workbenchSource.indexOf(start);
  const endIndex = workbenchSource.indexOf(end, Math.max(startIndex, 0));
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return workbenchSource.slice(startIndex, endIndex);
}

const suggestionWidgetSource = extractSourceBlock('function CapsuleSuggestionWidget', 'function AssistantMarkdown');
const repositoryGridSource = extractSourceBlock('function CapsuleRepositoryGrid', 'function CapsuleRepositoryTile');
const inspectorSheetSource = extractSourceBlock('function CapsuleInspectorSheet', 'function PraxisGuideChat');

describe('Tasklet PRAXIS workbench contract', () => {
  it('keeps model routing TACITUS-owned in the main composer', () => {
    expect(source).toContain('TACITUS routes model, worker, and tools');
    expect(source).not.toContain('aria-label="Model"');
    expect(source).not.toContain('setSelectedModel');
  });

  it('keeps the main Ask composer empty with rotating guidance placeholders', () => {
    expect(source).toContain('const askComposerPlaceholderPrompts = [');
    expect(source).toContain("const [prompt, setPrompt] = useState('')");
    expect(source).toContain('setAskPlaceholderIndex');
    expect(source).toContain('placeholder={askComposerPlaceholder}');
    expect(source).toContain('Draft a cited options memo from the active ContextCapsule.');
    expect(source).toContain('Run a source-gap check before drafting the recommendation.');
    expect(source).not.toContain("const [prompt, setPrompt] = useState('Draft a sourced options memo from the active capsule.')");
    expect(source).not.toContain('placeholder="Describe a task or responsibility"');
  });

  it('uses the canonical conversation turn endpoint from the one-bar composer', () => {
    expect(source).toContain('/api/conversations/${encodeURIComponent(nextThreadId)}/turns');
    expect(source).not.toContain("fetch('/api/ai/ask-praxis'");
    expect(source).toContain("currentToolId: 'ask-praxis'");
    expect(source).toContain('appliedCapsules: activeCapsuleStack.map');
  });

  it('keeps conversation URLs capsule-scoped for sends and copied links', () => {
    expect(source).toContain('const currentConversationPath = buildConversationPath(currentCapsuleId, nextThreadId)');
    expect(source).toContain('currentPath: currentConversationPath');
    expect(source).toContain("url.searchParams.set('capsuleId', capsuleId)");
  });

  it('restores saved conversation turns before falling back to legacy Ask thread history', () => {
    expect(source).toContain('fetch(`/api/conversations/${encodeURIComponent(threadIdToLoad)}`');
    expect(source).toContain('savedConversationTurnsToMessages');
    expect(source).toContain('loadLegacyAskThreadHistory');
  });

  it('loads saved homepage conversations before separate agent-run recents', () => {
    expect(source).toContain("fetch('/api/conversations', { credentials: 'include' })");
    expect(source).toContain('savedConversations.slice(0, 6).map');
    expect(source).toContain('savedConversationHref(conversation');
    expect(source).toContain('router.push(href)');
    expect(source).toContain('Agent runs');
    expect(source.indexOf('savedConversations.slice(0, 6).map')).toBeLessThan(source.indexOf('agentRuns.length ? agentRuns.slice(0, 5).map'));
  });

  it('keeps retry/source-check actions on the active conversation thread', () => {
    expect(source).toContain('const nextThreadId = ensureConversationThread()');
    expect(source).toContain("onSourceCheck={() => void sendToPraxis(selectedAgent, `Source-check this answer in the active conversation");
    expect(source).toContain('retryFromMessage(index)');
  });

  it('renders richer assistant messages inside the homepage conversation block', () => {
    expect(source).toContain('data-testid="praxis-chat-thread"');
    expect(source).toContain('answerEnvelopeFromDataStreamLine(line)');
    expect(source).toContain('ConversationReceiptSummary');
    expect(source).toContain('ConversationSourcePreviewPanel');
    expect(source).toContain('data-testid="praxis-answer-source-preview"');
    expect(source).toContain('Source receipt');
    expect(source).toContain('Follow-ups');
    expect(source).toContain('safeMarkdownHref(href)');
    expect(source).toContain("target={external ? '_blank' : undefined}");
  });

  it('defines selected text actions with advanced labels hidden behind intent', () => {
    for (const expected of [
      'Ask PRAXIS',
      'Save to capsule',
      'Source-check',
      'Add to memo',
    ]) {
      expect(source).toContain(expected);
    }

    expect(source).toContain("'sourceability'");
    expect(source).toContain("'causality'");
    expect(source).toContain("'rules'");
    expect(source).toContain("'temporality'");
    expect(source).toContain('Advanced label');
    expect(source).toContain('advancedLabel');
    expect(source).toContain("defaultAdvancedLabel = 'sourceability'");
    expect(source).not.toContain("'human-friction'");
    expect(source).not.toContain("'open-question'");
    expect(source).not.toContain("label: 'Human friction'");
    expect(source).not.toContain("label: 'Open question'");
    expect(source).toContain('prefillComposerFromSelection');
    expect(source).toContain('sourceCheckPrompt');
    expect(source).toContain('memoNote');
    expect(source).not.toContain('Turn into memo note');
  });

  it('uses a tiny selected text trigger before opening the compact menu', () => {
    expect(source).toContain('selectedSpanStatus');
    expect(source).toContain('selectionRect');
    expect(source).toContain('selectionZone');
    expect(source).toContain('selectedSpanMenuOpen');
    expect(source).toContain('data-testid="text-span-trigger"');
    expect(source).toContain('Use in PRAXIS');
    expect(source).toContain('data-testid="text-span-action-menu"');
    expect(source).toContain('role="menu"');
    expect(source).toContain('setSelectedSpanMenuOpen(true)');
    expect(source).toContain('Saved as evidence span');
    expect(source).toContain('Added to memo');
    expect(source).not.toContain('data-testid="text-span-core-popover"');
    expect(source).not.toContain('Save or inspect this passage');
    expect(source).not.toContain('Ask PRAXIS about this span');
    expect(source).not.toContain('Attach to active capsule');
  });

  it('captures selected text only from explicit meaningful zones', () => {
    for (const zone of [
      'data-selection-zone="assistant-answer"',
      'data-selection-zone="source-preview"',
      'data-selection-zone="repository-text"',
      'data-selection-zone="source-pack"',
      'data-selection-zone="memo-text"',
    ]) {
      expect(source).toContain(zone);
    }

    expect(source).toContain("closest('[data-selection-zone]')");
    expect(source).toContain('getSelectionZoneElement');
    expect(source).toContain('handleDocumentSelection');
    expect(source).not.toContain('onMouseUp={() => handleMessageSelection');
    expect(source).not.toContain('<Metric data-selection-zone');
    expect(source).not.toContain('<button data-selection-zone');
  });

  it('uses specific Ask PRAXIS failure guidance instead of a generic dead end', () => {
    expect(source).toContain('describeAskFailure');
    expect(source).toContain('@/lib/ai/tasklet-stream');
    expect(source).not.toContain('I could not complete that request. Check authentication and model access, then try again.');
  });

  it('forwards capsule package context and preserves real stream error details', () => {
    expect(source).toContain('contextPackageId: selectedCapsule?.capsuleId');
    expect(source).toContain('parseDataStreamError(line)');
    expect(source).toContain('Conversation saved at this link with');
    expect(source).not.toContain("return typeof parsed === 'string' ? parsed : 'Ask PRAXIS stream failed.'");
  });

  it('does not render old manual action rows above the composer', () => {
    expect(source).not.toContain('policyNextActions');
    expect(source).not.toContain('data-testid="policy-team-next-actions"');
    expect(source).not.toContain('data-testid="capsule-workspace-actions"');
    expect(source).not.toContain('Research actions');
    expect(source).not.toContain('<CapsuleMap');
    expect(source).not.toContain('Weekly Middle East Analysis');
    expect(source).not.toContain('Sudan');
  });

  it('renders the runtime health semaphore near the home control strip', () => {
    expect(source).toContain('RuntimeHealthSemaphore');
    expect(source).toContain('data-testid="runtime-health-semaphore"');
  });

  it('keeps one category-native context chain and exposes one canonical taxonomy filter surface', () => {
    expect((source.match(/data-testid="capsule-context-bar"/g) ?? []).length).toBe(1);
    expect((source.match(/data-testid="capsule-taxonomy-filter-bar"/g) ?? []).length).toBe(1);
    expect(source).toContain('function CapsuleTaxonomyFilterBar');
    expect(source).toContain('data-testid="active-capsule-strip"');
    expect(source).toContain('data-testid="active-capsule-open-details"');
    expect(source).toContain('data-testid="capsule-context-composer"');
    expect(source).toContain('Context Chain');
    expect(source).toContain('Generic analyst');
    expect(source).toContain('capsuleChainSlots');
    expect(source).toContain('Sources/References');
    expect(source).toContain('capsuleDefaultRole(capsule)');
    expect(source).toContain('data-testid="capsule-taxonomy-surface"');
    expect(source).toContain('capsule-taxonomy-panel-solid');
    expect(source).toContain('id="capsule-repository-section"');
    expect(source).toContain('Source pack');
    expect(source).toContain('Starter excerpts');
    expect(source).toContain('AI use guidance');
    expect(source).toContain('Suggested next actions');
    expect(source).toContain('data-testid="capsule-rich-profile"');
    expect(source).toContain('Purpose');
    expect(source).toContain('Decision Use');
    expect(source).toContain('Improvement Ideas');
    expect(source).toContain('Gaps/Risks');
    expect(source).toContain('Run Recipe');
    expect(source).toContain('Compatible Capsules');
    expect(source).toContain('Next: {bestNextAction}');
    expect(source).toContain('const purposeLine = richProfile?.purpose');
    expect(source).not.toContain('data-testid="capsule-tool-output-lanes"');
    expect(source).not.toContain('Assumption checks, source checks, reasoning tools.');
    expect(source).not.toContain('Two-pagers, diplomatic notes, briefs, handovers.');
    expect(source).toContain('All types');
    expect(source).toContain('Governance');
    expect(source).toContain('Policy Teams');
    expect(source).toContain('policyTeamId');
    expect(source).toContain('/app/capsules');
    expect(source).toContain('onAdd={() => applyCapsuleCard(capsule)}');
    expect(source).toContain('Add</button>');
    expect(source).toContain('Review its category before relying on it.');
    expect(source).not.toContain('Use as user</button>');
    expect(source).not.toContain('Use as situation</button>');
    expect(source).not.toContain('Use as output</button>');
    expect(source).not.toContain('Add as reference</button>');
    expect(source).not.toContain('data-testid="capsule-context-picker"');
    expect(source).not.toContain('capsulePickerQuery');
    expect(source).not.toContain('aria-label="Capsule type filters"');
    expect(source).not.toContain('aria-label="New context capsule presets"');
    expect(source).toContain('placeholder="Search capsules by title, role, domain, source posture"');
    expect(source).toContain('data-testid="workbench-search-trigger"');
    expect(source).toContain("new CustomEvent('open-praxis-search'");
    expect(source).toContain('data-testid="workbench-red-flags"');
    expect(source).toContain('data-testid="workbench-diagnostics-drawer"');
    expect(source).toContain('data-testid="capsule-filter-receipt"');
  });

  it('keeps the Ask composer visually prominent without splitting the one-bar flow', () => {
    expect(source).toContain('praxis-composer-focus-shell');
    expect(source).toContain('Draft a cited options memo');
    expect(source).toContain('source-gap check');
    expect(source).toContain('handover');
    expect(source).toContain('red-team review');
    expect(source).toContain('data-testid="ask-capsule-workflow-preview"');
  });

  it('shows local capsule suggestions near the Ask composer without auto-applying them', () => {
    expect(source).toContain("import { rankAskCapsuleSuggestions");
    expect(source).toContain('const ASK_CAPSULE_SUGGESTION_DEBOUNCE_MS = 450');
    expect(source).toContain('const ASK_CAPSULE_SUGGESTION_VISIBLE_MS = 30_000');
    expect(source).toContain('function hasMeaningfulAskPrompt');
    expect(source).toContain('const [debouncedSuggestionPrompt, setDebouncedSuggestionPrompt]');
    expect(source).toContain('window.setTimeout(() => {');
    expect(source).toContain('setDebouncedSuggestionPrompt(hasMeaningfulAskPrompt(nextPrompt) ? nextPrompt :');
    expect(source).toContain('const askCapsuleSuggestions = useMemo');
    expect(source).toContain('prompt: debouncedSuggestionPrompt');
    expect(source).toContain('limit: 3');
    expect(source).toContain('data-testid="ask-capsule-suggestion-widget"');
    expect(suggestionWidgetSource).toContain('data-testid={`ask-capsule-suggestion-chip-${suggestion.capsuleId}`}');
    expect(suggestionWidgetSource).toContain('title={`why this capsule: ${suggestion.whyThisCapsule} ${suggestion.whatItChangesForAgent}`}');
    expect(suggestionWidgetSource).toContain('window.setTimeout(() => setVisible(false), ASK_CAPSULE_SUGGESTION_VISIBLE_MS)');
    expect(suggestionWidgetSource).toContain('onMouseEnter={() => setSuggestionPaused(true)}');
    expect(suggestionWidgetSource).toContain('onFocusCapture={() => setSuggestionPaused(true)}');
    expect(suggestionWidgetSource).toContain('onMouseLeave={() => setSuggestionPaused(false)}');
    expect(suggestionWidgetSource).toContain('onBlurCapture={(event) => {');
    expect(source).toContain('human-gated context');
    expect(source).toContain('onAdd={(suggestion) => applyCapsuleCard(suggestion.capsule)}');
    expect(source).toContain('autoApplied: false');
    expect(suggestionWidgetSource).not.toContain('<article');
    expect(suggestionWidgetSource).not.toContain('md:grid-cols-2');
    expect(source).not.toContain('useEffect(() => applyCapsuleCard(askCapsuleSuggestions');
  });

  it('renders per-answer agent activity, source audit, claim ledger, and continuation actions', () => {
    expect(source).toContain('ConversationAgentActivityRail');
    expect(source).toContain('data-testid="praxis-answer-agent-activity"');
    expect(source).toContain('ConversationTraceabilityPanel');
    expect(source).toContain('data-testid="praxis-answer-traceability-panel"');
    expect(source).toContain('Traceability');
    expect(source).toContain('Policy context');
    expect(source).toContain('Human review');
    expect(source).toContain('Claim ledger');
    expect(source).toContain('Supported');
    expect(source).toContain('Unsupported');
    expect(source).toContain('Continue as memo');
    expect(source).toContain('Expand evidence annex');
    expect(source).toContain('Create output capsule');
    expect(source).toContain('generationReceipt');
    expect(source).toContain('sourceAudit');
  });

  it('uses the capsule inspector sheet as the single capsule inspection surface', () => {
    expect(source).toContain('function openCapsuleInspector');
    expect(source).toContain('data-testid="capsule-inspector-sheet"');
    expect(source).toContain('data-testid="capsule-inspector-chat-panel"');
    expect(source).toContain('{inspectorOpen && selectedCapsule ? (');
    expect(source).toContain('if (!capsule) return null;');
    expect(source).not.toContain('Select a capsule.');
    expect(source).toContain('onSelect={openCapsuleInspector}');
    expect(source).toContain('onSelect={() => openCapsuleInspector(capsule)}');
    expect(source).toContain('aria-label={`Inspect ${capsule.label}`}');
    expect(source).toContain('onInspect={() => openCapsuleInspector(capsule)}');
    expect(source).not.toContain('onInspect={() => openGuideChatForCapsule(capsule)}');
  });

  it('surfaces v2 governance badges and inspector sections without adding a new capsule page', () => {
    expect(source).toContain('function capsuleGovernanceBadges');
    expect(source).toContain('data-testid="capsule-governance-badges"');
    expect(source).toContain('Gate');
    expect(source).toContain('Ontology');
    expect(source).toContain('Advisory');
    expect(source).toContain('Graph proposal');
    expect(source).toContain('Review card');
    expect(source).toContain('data-testid="capsule-v2-inspector-tabs"');
    expect(source).toContain('Anatomy');
    expect(source).toContain('Ontology Stack');
    expect(source).toContain('Dynamic ontology');
    expect(source).toContain('Embedded graph seed');
    expect(source).toContain('ontologyOverlay');
    expect(source).toContain('Cognee mode');
    expect(source).toContain('Agent Read');
    expect(source).toContain('read contract');
    expect(source).not.toContain('/app/ontology');
    expect(source).not.toContain('/app/community-review');
  });

  it('uses opaque operational panel classes for the capsule workspace', () => {
    for (const marker of [
      'praxis-workbench-panel',
      'praxis-shelf-panel',
      'praxis-menu-panel',
      'praxis-card-panel',
      'praxis-select-control',
      'data-testid="capsule-inspector-chat-panel"',
    ]) {
      expect(visualSource).toContain(marker);
    }

    expect(source).toContain('data-testid="capsule-taxonomy-surface"');
    expect(source).toContain('featured-expert-picks-shelf');
    expect(source).toContain('data-testid="tasklet-capsule-cards"');
    expect(source).not.toContain('<WorkActionMenu label="Work on this" />');
  });

  it('renders the live stack inside the composer instead of a separate rail above it', () => {
    expect(source).not.toContain('<LivingContextRail');
    expect(source).not.toContain('livingRailCells');
    expect(source).toContain('const activeCapsuleStack = useMemo');
    expect(source).toContain('ensureDefaultCapsuleStack(activeCapsules');
    expect(source).toContain("data-testid=\"capsule-context-composer\"");
    expect(source).not.toContain('Profile / user');
    expect(source).not.toContain('Situation / context');
    expect(source).not.toContain('Model knowledge is the default baseline');
    expect(source).toContain('data-testid="context-health-indicator"');
    expect(source).toContain('Save context capsule');
    expect(source).toContain('onRemove={() => removeCapsule(capsule.id)}');
  });

  it('sends ordered live capsule stacks without automatic combine persistence', () => {
    expect(source).toContain('appliedCapsules: activeCapsuleStack.map');
    expect(source).toContain('const activeContextStack = buildActiveContextStack(');
    expect(source).toContain('const outputCapsule = activeCapsuleStack.find');
    expect(source).toContain('const situationCapsule = activeCapsuleStack.find');
    expect(source).toContain('sourceIds: activeCapsuleStack.filter((capsule) => capsule.role ===');
    expect(source).toContain('userModelId: userCapsule?.id ?? null');
    expect(source).toContain('saveCombinedCapsuleStack');
    expect(source).toContain('Add at least two capsules before saving a retrievable context capsule.');
    expect(source).not.toContain('if (next.length >= 2) await combineCapsuleLiteStack(next);');
    expect(source).not.toContain('void combineCapsuleLiteStack(current.slice(0, 5));');
  });

  it('keeps the default context chain empty except for the user model baseline', () => {
    expect(source).not.toContain('Model knowledge is the default baseline. Add capsules, sources, or web search to make PRAXIS more specific, current, and reusable.');
    expect(source).toContain("const activeCapsuleForStrip = selectedCapsule ?? activeCapsuleStack[0] ?? null");
    expect(source).not.toContain('?? starterCapsuleSummaries[0] ?? null');
    expect(source).toContain("id: 'starter-user-generic-analyst'");
    expect(source).toContain("label: 'Generic analyst'");
    expect(source).toContain("const [activeCapsules, setActiveCapsules] = useState<ActiveCapsuleChip[]>([STARTER_USER_CAPSULE_CHIP])");
    expect(source).toContain("action: 'Add context'");
    expect(source).toContain("action: 'Attach sources'");
    expect(source).toContain("action: 'Add checks'");
    expect(source).toContain("action: 'Choose output'");
  });

  it('shows context health, utility actions, and apply feedback on the chain', () => {
    expect(source).toContain('function getContextHealth');
    expect(source).toContain("label: 'Baseline'");
    expect(source).toContain("label: 'Ready'");
    expect(source).toContain("label: 'Grounded'");
    expect(source).toContain("label: 'Operational'");
    expect(source).toContain('data-testid="context-health-indicator"');
    expect(source).toContain('data-context-apply-state');
    expect(source).toContain('context-apply-pulse');
    expect(source).toContain('Share');
    expect(source).toContain('Download');
    expect(source).toContain('Improve');
  });

  it('sends the active context chain into manual agent-run creation', () => {
    expect(source).toContain('selectedCoreIdsFromContextStack(activeContextStack)');
    expect(source).toContain('toolCoreIds: selectedToolIds');
    expect(source).toContain('appliedCapsules: activeCapsuleStack.map((capsule) => ({');
    expect(source).toContain('activeContextStack');
    expect(source).toContain('selectedTools: selectedToolIds');
    expect(source).toContain('sourcePosture: contextHealth.label');
    expect(source).toContain('data-testid="agent-context-receipt"');
    expect(source).toContain('Context read by agent');
    expect(source).not.toContain('selectedCoreIds: capsule.coreRefs');
  });

  it('previews capsule reads and workflow tools before the one-bar Ask send', () => {
    expect(source).toContain('data-testid="ask-capsule-workflow-preview"');
    expect(source).toContain('PRAXIS will read');
    expect(source).toContain('PRAXIS may use');
    expect(source).toContain('composerReadTargets');
    expect(source).toContain('composerUseTargets');
    expect(source).toContain('ContextCapsule evidence first');
    expect(source).toContain('sourceability reviewer before memo/PDF output');
  });

  it('uses dnd-kit for composer reordering and modal capsule browsing', () => {
    expect(source).toContain("from '@dnd-kit/core'");
    expect(source).toContain("from '@dnd-kit/sortable'");
    expect(source).toContain('DndContext');
    expect(source).toContain('SortableContext');
    expect(source).toContain('useDraggable');
    expect(source).toContain('useDroppable');
    expect(source).toContain('data-testid="capsule-context-dropzone"');
    expect(source).toContain('data-testid="capsule-browser-modal"');
    expect(source).toContain('filterBar={');
    expect(source).toContain('setCapsuleBrowserOpen(true)');
    expect(source).toContain('handleCapsuleDragEnd');
  });

  it('drives taxonomy filters from the shared statistics contract', () => {
    expect(source).toContain('buildCapsuleTaxonomyStats');
    expect(source).toContain('userCapsuleTaxonomyStats');
    expect(source).toContain('publicCapsuleTaxonomyStats');
    expect(source).toContain('setCapsuleTypeFilter');
    expect(source).toContain('setCapsuleDomainFilter');
    expect(source).toContain('setCapsulePolicyTeamFilter');
    expect(source).toContain('policyTeamFilter');
    expect(source).toContain('typeId={capsuleTypeFilter}');
    expect(source).toContain('domainId={capsuleDomainFilter}');
    expect(source).toContain('policyTeamId={capsulePolicyTeamFilter}');
    expect(source).toContain('<CapsuleTaxonomyFilterBar');
    expect(source).toContain('Source refs');
    expect(source).toContain('Document refs');
    expect(source).not.toContain('function capsuleTypeCount(');
  });

  it('uses the server capsule inventory summary for authenticated repository counts', () => {
    expect(source).toContain('import type { CapsuleInventorySummary');
    expect(source).toContain('const [capsuleInventorySummary, setCapsuleInventorySummary]');
    expect(source).toContain('capsuleInventorySummary ? {');
    expect(source).toContain('activeCapsules');
    expect(source).toContain('archivedCapsules');
    expect(source).toContain('sourceReferences');
    expect(source).toContain('documentReferences');
    expect(source).toContain('setCapsuleInventorySummary(library.summary');
    expect(source).toContain('countUniqueCoreRefs');
    expect(source).toContain('userCapsuleCount={userCapsuleTaxonomyStats.visibleCapsules}');
    expect(source).toContain('archivedCount={userCapsuleTaxonomyStats.archivedCapsules}');
  });

  it('keeps capsule filter counts tied to real visible capsules instead of summed facets', () => {
    expect(source).toContain('const filterCountTotal = visibleTotalCount ?? visibleItems.length');
    expect(source).toContain('visibleTotalCount={stats.visibleCapsules}');
    expect(source).toContain('function domainOrPolicyTeamMatchesCapsule');
    expect(source).toContain('domainOrPolicyTeamMatchesCapsule(capsule, domainFilter)');
    expect(source).not.toContain('visibleItems.reduce((sum, item) => sum + item.count, 0)');
  });

  it('separates capsule card inspection from capsule chat and keeps chat available inside the inspector', () => {
    expect(source).toContain('function viewCapsuleCard');
    expect(source).toContain('function openGuideChatForCapsule');
    expect(source).toContain('function sendGuideChat');
    expect(source).toContain('onView');
    expect(source).toContain('Read more</button>');
    expect(source).toContain('data-testid="capsule-inspector-chat-panel"');
    expect(source).toContain('data-testid="capsule-inspector-chat-button"');
    expect(source).toContain('data-testid="praxis-guide-chat"');
    expect(source).toContain('data-testid="praxis-guide-chat-submit"');
    expect(source).toContain('onAskCapsule');
    expect(source).toContain('chatMessages={guideMessages}');
    expect(source).not.toContain('chatMessages={chatMessages}');
    expect(source).toContain("currentToolId: 'praxis-guide-chat'");
  });

  it('uses the login-matched shared brand treatment in the app workbench', () => {
    expect(source).toContain("import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip'");
    expect(source).toContain('<PraxisBrandChip');
    expect(source).not.toContain('bg-sage text-white">◳');
  });

  it('gives the authenticated homepage one clear Capsules launch button', () => {
    expect(source).toContain('data-testid="open-capsule-factory-cta"');
    expect(source).toContain('Open Capsules');
    expect(source).toContain("!initialPanel && mode === 'app'");
  });

  it('marks the canonical Capsules sidebar link without changing route identity', () => {
    expect(primaryNavSource).toContain("id: 'capsules'");
    expect(primaryNavSource).toContain("label: 'Capsules'");
    expect(primaryNavSource).toContain("href: '/app/capsules'");
    expect(sidebarSource).toContain('item.hint');
  });

  it('renders app capsules as a first-class dense repository surface', () => {
    expect(source).toContain('const isCapsuleRepositoryPage = initialPanel ===');
    expect(source).toContain("id: 'sources', label: 'Sources'");
    expect(source).toContain("href={isAuthenticated ? '/app/capsules?lane=repository'");
    expect(source).toContain('data-testid="document-repository-section"');
    expect(source).toContain('Attach</button>');
    expect(source).toContain('Detach</button>');
  });

  it('reframes /app/capsules as a simple Capsule Studio with reviewable AI changes', () => {
    expect(source).toContain('const isCapsuleStudioMode = isCapsuleRepositoryPage');
    expect(source).toContain('data-testid="capsule-studio-header"');
    expect(source).toContain('data-testid="capsule-studio-primary-actions"');
    expect(source).toContain('{!isCapsuleStudioMode ? (');
    expect(source).toContain('data-testid="praxis-main-composer"');
    expect(source).toContain('praxis-composer-input-well');
    expect(source).toContain('Write your prompt here');
    expect(source).toContain('isCapsuleStudioMode ? \'mt-6 sm:mt-8\'');
    expect(source).toContain('data-testid="capsule-studio-command-band"');
    expect(source).toContain('data-testid="capsule-studio-library"');
    expect(source).toContain('data-testid="capsule-studio-workspace"');
    expect(source).toContain('data-testid="capsule-studio-review-queue"');
    expect(source).toContain('Build capsule');
    expect(source).toContain('Use in Ask');
    expect(source).toContain('Review improvements');
    expect(source).toContain('Details');
    expect(source).toContain('Sources');
    expect(source).toContain('Improve safely');
    expect(source).toContain('data-testid="capsule-studio-chat-panel"');
    expect(source).not.toContain('data-testid="capsule-factory-sidebar"');
    expect(source).not.toContain('factorySidebarItems');
    expect(source).toContain('factoryBuilderLanes');
    expect(source).toContain('Inspect anatomy');
    expect(source).toContain('Add sources');
    expect(source).toContain('Source-to-claim inspection');
    expect(source).not.toContain('Capsule graph');
    expect(source).not.toContain("id: 'graph'");
    expect(source).not.toContain('DIALECTICA lane');
    expect(source).not.toContain('KAIROS lane');
    expect(source).not.toContain('AGON lane');
    expect(source).toContain('Review draft');
    expect(source).toContain("type CapsuleFactoryReviewState = 'draft' | 'reviewed' | 'applied' | 'rejected'");
    expect(source).toContain('factoryReviewDiffs');
    expect(source).toContain('Apply reviewed diff');
    expect(source).toContain('Reject');
    expect(source).toContain('reviewable capsule improvements');
    expect(source).toContain('Do not silently mutate the capsule');
    expect(source).toContain('Download .praxis');
    expect(source).toContain('Make private');
    expect(source).toContain('Make public');
    expect(source).not.toContain('aria-label="Capsule factory navigation"');
    expect(source).not.toContain('Capsule Factory');
  });

  it('shows sanitized runtime proof inside the active capsule/run area', () => {
    expect(source).toContain('RuntimeProofStrip');
    expect(source).toContain('data-testid="runtime-proof-strip"');
    expect(source).toContain('active capsule');
    expect(source).toContain('graph mode');
    expect(source).toContain('Cognee mode');
    expect(source).toContain('last Ask receipt');
    expect(source).toContain('latest mirrored event');
    expect(source).toContain('memo/output link');
    expect(source).not.toContain('internalEstimatedCostCents');
    expect(source).not.toContain('internalSpendCents');
  });

  it('uses one capsule-card contract for public starters and authenticated fallback cards', () => {
    expect(source).toContain('starterCapsuleSummaries');
    expect(source).toContain('visibleCapsuleCards');
    expect(source).toContain('filteredFeaturedCapsuleCards');
    expect(source).toContain('buildVisibleCapsuleCards');
    expect(source).toContain('starterDefinitionToCapsuleSummary');
    expect(source).toContain('const showingStarterFallback = isAuthenticated && !filteredUserCapsules.length');
    expect(source).toContain('selectedCapsuleTypeFilter: capsuleTypeFilter');
    expect(source).toContain('strictCapsuleTypeFilter(capsule, typeFilter)');
    expect(source).toContain("capsuleCategory(capsule) === 'situation'");
    expect(source).toContain("capsuleCategory(capsule) === 'tool'");
    expect(source).toContain("capsuleCategory(capsule) === 'output'");
    expect(source).toContain("capsuleCategory(capsule) === 'user'");
    expect(source).toContain("CapsuleEmptyState label=\"Loading capsules...\"");
    expect(source).toContain('compact={isCapsuleRepositoryPage || !isRepositoryPage}');
    expect(source).toContain('title={`Drag ${capsule.label} into context chain`}');
    expect(source).toContain('text-base font-semibold leading-6 text-slate-950');
    expect(source).toContain('Categories');
    expect(source).toContain('Read more</button>');
    expect(source).toContain('line-clamp-2 text-sm leading-6 text-slate-600');
    expect(source).not.toContain('<span className="block truncate text-sm font-semibold text-slate-900">{capsule.label}</span>');
    expect(source).not.toContain('Add category');
    expect(source).not.toContain("CapsuleEmptyState label=\"No capsules found.\"");
  });

  it('keeps guide chat public handoff and local state separate from main Ask', () => {
    expect(source).toContain('const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([])');
    expect(source).toContain('const [guidePrompt, setGuidePrompt] = useState');
    expect(source).toContain('const [guideThreadId, setGuideThreadId] = useState<string | null>(null)');
    expect(source).toContain("const GUIDE_CHAT_STORAGE_KEY = 'praxis-guide-chat-state:v1'");
    expect(source).toContain('type GuideChatStorageState');
    expect(source).toContain('function loadGuideChatState');
    expect(source).toContain('function persistGuideChatState');
    expect(source).toContain('window.localStorage.getItem(GUIDE_CHAT_STORAGE_KEY)');
    expect(source).toContain('window.localStorage.setItem(GUIDE_CHAT_STORAGE_KEY');
    expect(source).toContain('setGuideChatOpen(Boolean(restored.open))');
    expect(source).toContain('open: guideChatOpen');
    expect(source).toContain('sendPublicToLogin(`PRAXIS guide question');
    expect(source).toContain('setGuideMessages((current) => [...current, userMessage, { role:');
    expect(source).toContain('buildGuideChatPrompt(cleanPrompt, targetCapsule');
    expect(source).not.toContain('setActiveTab(\'analysis\');\n    setStatus(`${capsule.label} is ready in Ask PRAXIS.`);');
  });

  it('makes the guide chat a larger persistent assistant without replacing Ask PRAXIS', () => {
    expect(source).toContain('w-[min(42rem,calc(100vw-2rem))]');
    expect(source).toContain('min-h-[22rem] max-h-[52vh]');
    expect(source).toContain('text-base leading-7');
    expect(source).toContain('PRAXIS guide, not the agentic Ask PRAXIS workspace');
    expect(source).toContain('Use the main Ask PRAXIS bar for agent runs');
    expect(source).toContain('Guide assistant');
    expect(source).toContain('aria-label="Clear PRAXIS guide chat"');
    expect(source).toContain("currentToolId: 'praxis-guide-chat'");
  });

  it('exposes usefulness rating as a distinct capsule card and inspector contract', () => {
    expect(source).toContain('type CapsuleUsefulnessRating');
    expect(source).toContain('buildCapsuleUsefulnessRating');
    expect(source).toContain('onRateUsefulness');
    expect(source).toContain("action: 'rate'");
    expect(source).toContain('capsule-usefulness-rating');
    expect(source).toContain('capsule-inspector-usefulness-rating');
    expect(source).toContain('Helped me/agent do useful work');
    expect(source).toContain('Save or fork this starter before rating usefulness.');
    expect(source).toContain('community.userRating');
    expect(source).toContain('community.averageRating');
    expect(source).toContain('ratingCount');
    expect(source).toContain('allowCommunityRating');
  });

  it('surfaces quality audit, enrichment, and review-gated improvement proposal affordances without canonical mutation', () => {
    expect(source).toContain('CapsuleQualityAuditResult');
    expect(source).toContain('CapsuleImprovementProposal');
    expect(source).toContain('CapsuleEnrichmentReceipt');
    expect(source).toContain('Quality audit');
    expect(source).toContain('Enrichment status');
    expect(source).toContain('Proposed next improvements');
    expect(source).toContain('review-gated');
    expect(source).toContain('Cognee advisory');
    expect(source).toContain('Firestore canonical');
  });

  it('adds a paid-only Exa agentic search toggle to conversation sends', () => {
    expect(source).toContain('agenticSearchPremiumEnabled');
    expect(source).toContain('canUseAgenticSearchPremium');
    expect(source).toContain('Exa agentic search');
    expect(source).toContain('Premium web');
    expect(source).toContain('agenticSearchPremium');
    expect(source).toContain('/login?mode=signup&plan=analyst');
    expect(source).not.toContain('EXA_API_KEY');
  });

  it('adds a free Research graph toggle beside Premium web without adding a top-level surface', () => {
    expect(source).toContain('researchGraphExtraEnabled');
    expect(source).toContain('setResearchGraphExtraEnabled');
    expect(source).toContain('Research graph');
    expect(source).toContain('GDELT + WD');
    expect(source).toContain('entity grounding, aliases, identifiers, event/media pulse, and relationship hints; advisory receipts only');
    expect(source).toContain('researchGraphExtra');
    expect(source).toContain('What PRAXIS learned from Research graph');
    expect(source).toContain('promote to graph proposal');
    expect(source).not.toContain("href=\"/app/research-graph\"");
    expect(primaryNavSource).not.toContain('research-graph');
  });

  it('keeps expert picks available outside the simplified capsule repository lane', () => {
    expect(source).toContain('FEATURED_EXPERT_PICK_CAPSULE_IDS');
    for (const expectedId of [
      'starter-situation-ai-governance-procurement',
      'starter-situation-humanitarian-rights-access',
      'starter-situation-mediation-track',
      'starter-tool-sourceability-matrix',
      'starter-tool-actor-leverage-veto-map',
      'starter-output-principals-decision-memo',
    ]) {
      expect(source).toContain(expectedId);
    }

    expect(source).toContain('Featured Expert Picks');
    expect(source).toContain("'featured-expert-picks-shelf'");
    expect(source).toContain("'intellectual-devices-shelf'");
    expect(source).toContain('data-testid="capsule-wide-shelves"');
    expect(source).toContain('data-testid="capsule-shelf-grid"');
    expect(source).toContain('[grid-template-columns:repeat(auto-fit,minmax(min(21rem,100%),1fr))]');
    expect(source).toContain('data-testid={`featured-expert-pick-${capsule.capsuleId}`}');
    expect(source).toContain('data-testid="build-your-own-knowledge-cta"');
    expect(source).toContain('Build your own inheritable knowledge for your team or agents');
    expect(source).toContain("sendPublicToLogin('Build your own inheritable knowledge for your team or agents.')");
    expect(source).toContain('setBuilderOpen(true)');
    expect(source).toContain('Expert pick');
    expect(source).toContain('Source posture');
    expect(source).toContain('Reasoning style');
    expect(source).toContain('Intellectual Devices');
    expect(source).toContain('deviceProfile');
    expect(source).toContain('domainAccent');
    expect(source).toContain('Human review gate');
    expect(source).toContain('capsule-human-reviewed-badge');
    expect(source).toContain('capsule-inspector-human-reviewed-badge');
    expect(source).toContain('humanReview.tooltip');
    expect(source).toContain('Best next action');
    expect(source).toContain('readiness signals');
  });

  it('keeps repository compatibility inside the Capsules surface instead of a separate page model', () => {
    expect(repositoryPageSource).toContain("redirect('/app/capsules?lane=repository')");
    expect(source).toContain("initialPanel?: 'ask' | 'capsules' | 'repository'");
    expect(source).toContain('data-testid="capsule-studio-source-section"');
    expect(source).toContain("const isRepositoryLane = isCapsuleRepositoryPage && resolvedInitialFactoryLane === 'sources'");
    expect(source).toContain('initialFactoryLane?: CapsuleFactoryLaneId');
    expect(routeSource).toContain("lane === 'repository' || lane === 'sources' ? 'sources' : undefined");
    expect(source).toContain("href={isAuthenticated ? '/app/capsules?lane=repository'");
    expect(source).toContain('Find missing sources');
  });

  it('simplifies the repository lane into filters, capsule tiles, and one popup workflow', () => {
    expect(source).toContain('data-testid="capsule-repository-grid"');
    expect(repositoryGridSource).toContain('[grid-template-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr))]');
    expect(repositoryGridSource).toContain('data-testid="capsule-repository-create-card"');
    expect(source).toContain('data-testid="capsule-repository-open"');
    expect(source).toContain('Open capsule');
    expect(source).toContain('Create new capsule');
    expect(source).toContain('function openRepositoryCapsuleInspector');
    expect(source).toContain('onOpen={(capsule) => openRepositoryCapsuleInspector(capsule)}');
    expect(source).toContain('data-testid="capsule-inspector-sheet"');
    expect(source).toContain('data-testid="capsule-inspector-chat-panel"');
    expect(source).toContain('Ask PRAXIS');
    expect(source).toContain('Improve safely');
    expect(source).toContain('Add to Ask');
    expect(source).toContain('isCapsuleRepositoryPage && !isRepositoryLane');
    expect(source).toContain('isRepositoryLane ? (');
    expect(source).not.toContain('onOpen={(capsule) => openRepositoryCapsuleModal(capsule)}');
  });

  it('keeps repository inspection extensive inside the capsule inspector sheet', () => {
    for (const expected of [
      'Purpose',
      'Source pack',
      'Starter excerpts',
      'Core refs',
      'Tools/Thinking Devices',
      'Recommended tools',
      'Output targets',
      'Review Gates',
      'AI use guidance',
      'Compatible Capsules',
      'capsule-inspector-usefulness-rating',
      'Ask PRAXIS',
      'Improve capsule',
      'Add to Ask',
    ]) {
      expect(inspectorSheetSource).toContain(expected);
    }
  });
});

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
    expect(source).toContain('Ask for a cited policy brief from the active ContextCapsule.');
    expect(source).toContain('Ask PRAXIS to check source gaps before drafting.');
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

  it('defines explainable selected-span targets with follow-up prompts', () => {
    for (const expected of [
      'support check',
      'informal power',
      'decision question',
    ]) {
      expect(source).toContain(expected);
    }

    expect(source).toContain("'sourceability'");
    expect(source).toContain("'human-friction'");
    expect(source).toContain("'open-question'");
    expect(source).not.toContain("id: 'temporality'");
    expect(source).not.toContain("id: 'causality'");
    expect(source).not.toContain("id: 'rules'");
    expect(source).not.toContain('decision horizon');
    expect(source).toContain('askPrompt');
    expect(source).toContain('sourceCheckPrompt');
    expect(source).toContain('memoNote');
    expect(source).toContain('Turn into memo note');
  });

  it('keeps selected text available through span attach success and failure states', () => {
    expect(source).toContain('selectedSpanStatus');
    expect(source).toContain('data-testid="text-span-core-popover"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('Use selected text');
    expect(source).toContain('Save or inspect this passage');
    expect(source).toContain('Ask PRAXIS about this span');
    expect(source).toContain('Source-check this span');
    expect(source).toContain('Clear selection');
    expect(source).toContain('setAttachedSpan');
    expect(source).not.toContain('Attach to active capsule');
    expect(source).not.toContain("setSelectedText('');\n    setSelectedMessageId(null);\n    setStatus(`Selected text attached");
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
    expect(source).toContain('data-testid="capsule-tool-output-lanes"');
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
    expect(source).toContain('Thinking devices');
    expect(source).toContain('Artifacts');
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
    expect(source).toContain('{!isRepositoryLane ? <CapsuleTaxonomyFilterBar');
    expect(source).toContain('Source refs');
    expect(source).toContain('Document refs');
    expect(source).not.toContain('function capsuleTypeCount(');
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
    expect(source).toContain('Details</button>');
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
    expect(source).toContain('Manage reusable ContextCapsules');
    expect(source).toContain("id: 'sources', label: 'Sources'");
    expect(source).toContain('data-testid="capsule-factory-repository-lane"');
    expect(source).toContain("href={isAuthenticated ? '/app/capsules?lane=repository'");
    expect(source).toContain('data-testid="document-repository-section"');
    expect(source).toContain('Attach</button>');
    expect(source).toContain('Detach</button>');
  });

  it('reframes /app/capsules as capsule-centered management with reviewable AI changes', () => {
    expect(source).toContain('const isCapsuleFactoryMode = isCapsuleRepositoryPage');
    expect(source).toContain('data-testid="capsule-factory-header"');
    expect(source).toContain('data-testid="capsule-factory-actions"');
    expect(source).toContain('{!isCapsuleFactoryMode ? (');
    expect(source).toContain('data-testid="praxis-main-composer"');
    expect(source).toContain('isCapsuleFactoryMode ? \'mt-6 sm:mt-8\'');
    expect(source).toContain('Manage reusable ContextCapsules');
    expect(source).toContain('data-testid="capsule-factory-command-band"');
    expect(source).toContain('Manage the capsules your policy work depends on.');
    expect(source).toContain('Library');
    expect(source).toContain('Create capsule');
    expect(source).toContain('Build your own capsule');
    expect(source).toContain('Inspect capsule');
    expect(source).toContain('Improve safely');
    expect(source).toContain('Submit for improvement');
    expect(source).toContain('What is inside?');
    expect(source).toContain('Find source gaps');
    expect(source).toContain('How should I use this?');
    expect(source).toContain('Chat with this capsule');
    expect(source).toContain('factorySidebarItems');
    expect(source).toContain('Library');
    expect(source).toContain('Create');
    expect(source).toContain('Inspect');
    expect(source).toContain('Improve');
    expect(source).toContain('Sources');
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
    expect(source).toContain('line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900');
    expect(source).not.toContain('<span className="block truncate text-sm font-semibold text-slate-900">{capsule.label}</span>');
    expect(source).not.toContain('Add category');
    expect(source).not.toContain("CapsuleEmptyState label=\"No capsules found.\"");
  });

  it('keeps guide chat public handoff and local state separate from main Ask', () => {
    expect(source).toContain('const [guideMessages, setGuideMessages] = useState<ChatMessage[]>([])');
    expect(source).toContain('const [guidePrompt, setGuidePrompt] = useState');
    expect(source).toContain('const [guideThreadId, setGuideThreadId] = useState<string | null>(null)');
    expect(source).toContain('sendPublicToLogin(`PRAXIS guide question');
    expect(source).toContain('setGuideMessages((current) => [...current, userMessage, { role:');
    expect(source).toContain('buildGuideChatPrompt(cleanPrompt, targetCapsule');
    expect(source).not.toContain('setActiveTab(\'analysis\');\n    setStatus(`${capsule.label} is ready in Ask PRAXIS.`);');
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

  it('renders a filter-aware Featured Expert Picks shelf and build-your-own CTA', () => {
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
    expect(source).toContain("const isRepositoryLane = isCapsuleRepositoryPage && factoryLane === 'sources'");
    expect(source).toContain('initialFactoryLane?: CapsuleFactoryLaneId');
    expect(routeSource).toContain("lane === 'repository' || lane === 'sources' ? 'sources' : undefined");
    expect(source).toContain("href={isAuthenticated ? '/app/capsules?lane=repository'");
    expect(source).toContain('Find missing sources');
  });
});

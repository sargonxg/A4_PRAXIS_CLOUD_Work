import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('Tasklet PRAXIS workbench contract', () => {
  it('keeps model routing TACITUS-owned in the main composer', () => {
    expect(source).toContain('TACITUS routes model, worker, and tools');
    expect(source).not.toContain('aria-label="Model"');
    expect(source).not.toContain('setSelectedModel');
  });

  it('uses the canonical conversation turn endpoint from the one-bar composer', () => {
    expect(source).toContain('/api/conversations/${encodeURIComponent(nextThreadId)}/turns');
    expect(source).not.toContain("fetch('/api/ai/ask-praxis'");
    expect(source).toContain("currentToolId: 'ask-praxis'");
    expect(source).toContain('appliedCapsules: activeCapsules.map');
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

  it('keeps retry/source-check actions on the active conversation thread', () => {
    expect(source).toContain('const nextThreadId = ensureConversationThread()');
    expect(source).toContain("onSourceCheck={() => void sendToPraxis(selectedAgent, `Source-check this answer in the active conversation");
    expect(source).toContain('retryFromMessage(index)');
  });

  it('defines explainable selected-span targets with follow-up prompts', () => {
    for (const expected of [
      'support check',
      'decision horizon',
      'alternative explanation',
      'informal power',
      'constraint text',
      'decision question',
    ]) {
      expect(source).toContain(expected);
    }

    expect(source).toContain('askPrompt');
    expect(source).toContain('sourceCheckPrompt');
    expect(source).toContain('memoNote');
    expect(source).toContain('Turn into memo note');
  });

  it('keeps selected text available through span attach success and failure states', () => {
    expect(source).toContain('selectedSpanStatus');
    expect(source).toContain('Attach to active capsule');
    expect(source).toContain('Ask PRAXIS about this span');
    expect(source).toContain('Source-check this span');
    expect(source).toContain('setAttachedSpan');
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

  it('keeps one capsule context strip and exposes repository-backed type and domain filters', () => {
    expect(source).toContain('data-testid="capsule-context-bar"');
    expect(source).toContain('data-testid="capsule-context-composer"');
    expect(source).toContain('Generic policy starter capsule');
    expect(source).toContain('Starter analyst user capsule');
    expect(source).toContain('capsuleTypeFilters');
    expect(source).toContain('capsuleDomainFilters');
    expect(source).toContain('data-testid="capsule-taxonomy-surface"');
    expect(source).toContain('data-testid="capsule-tool-output-lanes"');
    expect(source).toContain('Thinking devices');
    expect(source).toContain('Artifacts');
    expect(source).toContain('All types');
    expect(source).toContain('Governance');
    expect(source).toContain('/app/capsules');
    expect(source).toContain("onUseAsUser={() => applyCapsuleCard(capsule, 'user')}");
    expect(source).toContain("onUseAsSituation={() => applyCapsuleCard(capsule, 'situation')}");
    expect(source).toContain("onUseAsOutput={() => applyCapsuleCard(capsule, 'output')}");
    expect(source).toContain("onAddReference={() => applyCapsuleCard(capsule, 'reference')}");
    expect(source).toContain('Use as user</button>');
    expect(source).toContain('Use as situation</button>');
    expect(source).toContain('Use as output</button>');
    expect(source).toContain('Add as reference</button>');
  });

  it('renders the live stack in the Living Context Rail and inside the composer', () => {
    expect(source).toContain('<LivingContextRail');
    expect(source).toContain('livingRailCells');
    expect(source).toContain('const activeCapsuleStack = useMemo');
    expect(source).toContain('ensureDefaultCapsuleStack(activeCapsules');
    expect(source).toContain("data-testid=\"capsule-context-composer\"");
    expect(source).toContain('Profile / user');
    expect(source).toContain('Situation / context');
    expect(source).toContain('Sources');
    expect(source).toContain('Output');
    expect(source).toContain('Readiness');
    expect(source).toContain('Save / fork context');
  });

  it('sends ordered live capsule stacks without automatic combine persistence', () => {
    expect(source).toContain('appliedCapsules: activeCapsuleStack.map');
    expect(source).toContain('const outputCapsule = activeCapsuleStack.find');
    expect(source).toContain('const situationCapsule = activeCapsuleStack.find');
    expect(source).toContain('sourceIds: activeCapsuleStack.filter((capsule) => capsule.role ===');
    expect(source).toContain('userModelId: userCapsule?.id ?? null');
    expect(source).toContain('saveCombinedCapsuleStack');
    expect(source).toContain('Save as combined capsule');
    expect(source).not.toContain('if (next.length >= 2) await combineCapsuleLiteStack(next);');
    expect(source).not.toContain('void combineCapsuleLiteStack(current.slice(0, 5));');
  });

  it('drives taxonomy buttons from the shared statistics contract', () => {
    expect(source).toContain('buildCapsuleTaxonomyStats');
    expect(source).toContain('userCapsuleTaxonomyStats');
    expect(source).toContain('publicCapsuleTaxonomyStats');
    expect(source).toContain('onSelect={setCapsuleTypeFilter}');
    expect(source).toContain('onSelect={setCapsuleDomainFilter}');
    expect(source).toContain("showRepairStates={isRepositoryPage}");
    expect(source).toContain('Source refs');
    expect(source).toContain('Document refs');
    expect(source).not.toContain('function capsuleTypeCount(');
  });

  it('uses the login-matched shared brand treatment in the app workbench', () => {
    expect(source).toContain("import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip'");
    expect(source).toContain('<PraxisBrandChip');
    expect(source).not.toContain('bg-sage text-white">◳');
  });

  it('renders app capsules as a first-class dense repository surface', () => {
    expect(source).toContain('const isCapsuleRepositoryPage = initialPanel ===');
    expect(source).toContain('Capsule repository');
    expect(source).toContain("'capsule-repository-page'");
    expect(source).toContain('lg:grid-cols-3');
    expect(source).toContain('data-testid="document-repository-section"');
    expect(source).toContain('Attach</button>');
    expect(source).toContain('Detach</button>');
  });

  it('uses one capsule-card contract for public starters and authenticated fallback cards', () => {
    expect(source).toContain('starterCapsuleSummaries');
    expect(source).toContain('visibleCapsuleCards');
    expect(source).toContain('starterDefinitionToCapsuleSummary');
    expect(source).toContain('const showingStarterFallback = isAuthenticated && !filteredUserCapsules.length');
    expect(source).toContain("CapsuleEmptyState label=\"Loading capsules...\"");
    expect(source).not.toContain("CapsuleEmptyState label=\"No capsules found.\"");
  });

  it('renders repository as its own cockpit page state instead of a sheet-only action', () => {
    expect(source).toContain("initialPanel?: 'ask' | 'capsules' | 'repository'");
    expect(source).toContain("const isRepositoryPage = initialPanel === 'repository' && mode === 'app'");
    expect(source).toContain("href={isAuthenticated ? '/app/repository' : '/login?mode=signup&redirect=%2Fapp%2Frepository'}");
    expect(source).toContain("data-testid={isRepositoryPage ? 'capsule-repository-page' : 'capsule-manager'}");
    expect(source).toContain('Find missing sources');
  });
});

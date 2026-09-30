import { describe, expect, it } from 'vitest';
import { COMMANDS } from '@/components/shared/global-search';
import { COMMAND_SEARCH_ACTIONS } from '@/lib/app-search/static-actions';
import { APP_SEARCH_COMMANDS, buildCapsuleSearchItem } from '@/lib/app-search/shared-contracts';
import { searchApp } from '@/lib/app-search/app-search';
import { buildFederatedSearchResults } from '@/lib/search/federated-app-search';
import { capsuleInspectionHref, WORKSPACE_ROUTES } from '@/lib/navigation/primary-nav';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

describe('search destinations across served and fallback results', () => {
  it('opens the existing builder for Create capsule on successful API search and offline fallback', async () => {
    const served = await searchApp({ uid: 'test-owner', isDemo: false, query: 'create capsule', types: ['action'] });
    expect(served.groups.actions.find((result) => result.id === 'create-capsule')?.href).toBe(WORKSPACE_ROUTES.newCapsule);
    const fallback = buildFederatedSearchResults({ query: 'create capsule', commands: COMMANDS });
    expect(fallback.find((result) => result.id === 'create-capsule')?.href).toBe(WORKSPACE_ROUTES.newCapsule);
    expect(APP_SEARCH_COMMANDS.find((result) => result.id === 'action:create-capsule')?.href).toBe(WORKSPACE_ROUTES.newCapsule);
  });

  it('keeps Chat and Capsules aligned with primary navigation and source receipts contextual', () => {
    for (const commands of [COMMANDS, COMMAND_SEARCH_ACTIONS]) {
      expect(commands.find((item) => item.id === 'open-home')?.href).toBe(WORKSPACE_ROUTES.chat);
      expect(commands.find((item) => item.id === 'open-capsule-factory')?.href).toBe(WORKSPACE_ROUTES.capsules);
      expect(commands.find((item) => item.id === 'open-workspace')?.href).toBe(WORKSPACE_ROUTES.sources);
      expect(commands.find((item) => item.id === 'fork-demo')?.href).toBe(WORKSPACE_ROUTES.starters);
    }
    const fallback = buildFederatedSearchResults({ query: '', commands: COMMANDS });
    expect(fallback.filter((result) => result.id === 'open-workspace')).toHaveLength(1);
  });

  it('opens the exact capsule inspector without implicitly attaching or changing the active chat', () => {
    const results = buildFederatedSearchResults({ query: 'Reviewed policy', commands: COMMANDS, capsules: [{ capsuleId: 'capsule:case/a & b', label: 'Reviewed policy' }] });
    const href = results.find((result) => result.group === 'Capsules')!.href!;
    const url = new URL(href, 'https://praxis.invalid');
    expect(url.pathname).toBe(WORKSPACE_ROUTES.capsules);
    expect(url.searchParams.get('lane')).toBe('inspect');
    expect(url.searchParams.get('starter')).toBe('capsule:case/a & b');
    expect(url.searchParams.has('capsuleId')).toBe(false);
    const starter = CAPSULE_STARTER_DEFINITIONS[0];
    expect(buildCapsuleSearchItem(starter).href).toBe(capsuleInspectionHref(starter.starterId));
  });

  it('opens review requests as editable prompts with no automatic mutation or generation', () => {
    const href = COMMANDS.find((item) => item.id === 'improve-capsule')!.href!;
    const url = new URL(href, 'https://praxis.invalid');
    expect(url.pathname).toBe(WORKSPACE_ROUTES.chat);
    expect(url.searchParams.get('prompt')).toContain('Do not apply changes without my approval.');
    expect(url.searchParams.has('autoSend')).toBe(false);
  });
});

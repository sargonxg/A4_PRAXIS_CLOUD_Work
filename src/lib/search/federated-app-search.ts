export type SearchResultGroup = 'Ask' | 'Commands' | 'Conversations' | 'Capsules' | 'Sources' | 'Diagnostics';
export type SearchResultStatus = 'ok' | 'degraded' | 'blocked' | 'warn';

export type StaticSearchCommand = {
  id: string;
  label: string;
  description: string;
  href?: string;
};

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  label: string;
  description: string;
  href?: string;
  run?: 'ask';
  icon: string;
  status?: SearchResultStatus;
  meta?: string;
};

type ConversationSearchItem = {
  conversationId?: string;
  id?: string;
  title?: string;
  capsuleId?: string;
  updatedAt?: string;
};

type CapsuleSearchItem = {
  capsuleId?: string;
  id?: string;
  label?: string;
  title?: string;
  scope?: string;
  health?: { warnings?: string[] | null; blockers?: string[] | null } | null;
  coreRefs?: { sourceCoreIds?: string[]; documentCoreIds?: string[] };
};

type RepositorySearchItem = {
  id?: string;
  name?: string;
  description?: string;
  documentCount?: number;
  sourceCount?: number;
  updatedAt?: string;
};

type DiagnosticsInput = {
  runtime?: { status?: string; summary?: string; checkedAt?: string } | null;
  agenticSearch?: { status?: string; summary?: string; checkedAt?: string } | null;
};

export type FederatedSearchData = {
  conversations?: ConversationSearchItem[];
  capsules?: CapsuleSearchItem[];
  repositories?: RepositorySearchItem[];
  diagnostics?: DiagnosticsInput;
  errors?: Partial<Record<SearchResultGroup, string>>;
};

export function buildFederatedSearchResults(input: {
  query: string;
  commands: StaticSearchCommand[];
} & FederatedSearchData): SearchResult[] {
  const rawQuery = input.query.replace(/^\?/, '').trim();
  const results: SearchResult[] = [
    {
      id: 'ask-praxis',
      group: 'Ask',
      label: rawQuery ? `Ask PRAXIS: ${rawQuery}` : 'Ask PRAXIS with current context',
      description: rawQuery
        ? 'Send this prompt through the existing Ask PRAXIS cockpit.'
        : 'Open Ask PRAXIS without changing the active capsule.',
      run: 'ask',
      icon: 'sparkles',
    },
  ];

  results.push(...input.commands.map((command) => ({
      id: command.id,
      group: 'Commands' as const,
      label: command.label,
      description: command.description,
      href: command.href,
      icon: 'command',
    })));

  results.push({
    id: 'open-repository-lane',
    group: 'Sources',
    label: 'Open source repository lane',
    description: 'Review source and document repository items inside Capsules.',
    href: '/app/capsules?lane=repository',
    icon: 'sources',
  });

  if (input.errors?.Conversations) {
    results.push(degradedRow('degraded-conversations', 'Conversations', 'Recent conversations unavailable', input.errors.Conversations));
  } else {
    results.push(...(input.conversations ?? [])
      .slice(0, 6)
      .map(conversationResult));
  }

  if (input.errors?.Capsules) {
    results.push(degradedRow('degraded-capsules', 'Capsules', 'Capsules unavailable', input.errors.Capsules));
  } else {
    results.push(...(input.capsules ?? [])
      .slice(0, 6)
      .map(capsuleResult));
  }

  if (input.errors?.Sources) {
    results.push(degradedRow('degraded-sources', 'Sources', 'Source repositories unavailable', input.errors.Sources));
  } else {
    results.push(...(input.repositories ?? [])
      .slice(0, 6)
      .map(repositoryResult));
  }

  if (input.errors?.Diagnostics) {
    results.push(degradedRow('degraded-diagnostics', 'Diagnostics', 'Diagnostics unavailable', input.errors.Diagnostics));
  } else if (input.diagnostics?.runtime || input.diagnostics?.agenticSearch) {
    results.push(diagnosticsResult(input.diagnostics));
  }

  return groupOrder(results);
}

type SearchFetch = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchFederatedSearchData(fetchImpl: SearchFetch = fetch): Promise<FederatedSearchData> {
  const [conversations, capsules, repositories, runtime, agenticSearch] = await Promise.all([
    readJson(fetchImpl, '/api/conversations', 'Conversations'),
    readJson(fetchImpl, '/api/context/capsules', 'Capsules'),
    readJson(fetchImpl, '/api/knowledge/repositories', 'Sources'),
    readJson(fetchImpl, '/api/health/runtime', 'Diagnostics'),
    readJson(fetchImpl, '/api/health/agentic-search', 'Diagnostics'),
  ]);

  return {
    conversations: arrayFrom<ConversationSearchItem>(conversations.data, 'conversations'),
    capsules: arrayFrom<CapsuleSearchItem>(capsules.data, 'capsules'),
    repositories: arrayFrom<RepositorySearchItem>(repositories.data, 'repositories'),
    diagnostics: {
      runtime: isRecord(runtime.data) ? runtime.data : null,
      agenticSearch: isRecord(agenticSearch.data) ? agenticSearch.data : null,
    },
    errors: {
      ...errorFor(conversations),
      ...errorFor(capsules),
      ...errorFor(repositories),
      ...(runtime.error && agenticSearch.error ? { Diagnostics: runtime.error } : {}),
    },
  };
}

function conversationResult(item: ConversationSearchItem): SearchResult {
  const id = item.conversationId ?? item.id ?? 'conversation';
  return {
    id: `conversation-${id}`,
    group: 'Conversations',
    label: item.title ?? 'PRAXIS conversation',
    description: id,
    href: `/app/conversations/${encodeURIComponent(id)}${item.capsuleId ? `?capsuleId=${encodeURIComponent(item.capsuleId)}` : ''}`,
    icon: 'conversation',
    meta: item.updatedAt ? `Updated ${formatDate(item.updatedAt)}` : undefined,
  };
}

function capsuleResult(item: CapsuleSearchItem): SearchResult {
  const id = item.capsuleId ?? item.id ?? 'capsule';
  const blockers = item.health?.blockers?.length ?? 0;
  const warnings = item.health?.warnings?.length ?? 0;
  const sourceCount = item.coreRefs?.sourceCoreIds?.length ?? 0;
  const documentCount = item.coreRefs?.documentCoreIds?.length ?? 0;
  return {
    id: `capsule-${id}`,
    group: 'Capsules',
    label: item.label ?? item.title ?? 'ContextCapsule',
    description: item.scope ? `${item.scope} capsule` : id,
    href: `/app/capsules?capsuleId=${encodeURIComponent(id)}`,
    icon: 'capsule',
    status: blockers > 0 ? 'blocked' : warnings > 0 ? 'warn' : 'ok',
    meta: `${sourceCount} sources / ${documentCount} docs`,
  };
}

function repositoryResult(item: RepositorySearchItem): SearchResult {
  const id = item.id ?? 'repository';
  return {
    id: `source-${id}`,
    group: 'Sources',
    label: item.name ?? 'Knowledge repository',
    description: item.description ?? 'Source and document repository item',
    href: `/app/capsules?lane=repository&repositoryId=${encodeURIComponent(id)}`,
    icon: 'sources',
    meta: `${item.documentCount ?? 0} docs / ${item.sourceCount ?? 0} sources`,
  };
}

function diagnosticsResult(input: DiagnosticsInput): SearchResult {
  const runtimeStatus = input.runtime?.status ?? 'unknown';
  const agenticStatus = input.agenticSearch?.status ?? 'unknown';
  const blocked = runtimeStatus === 'down' || runtimeStatus === 'blocked' || agenticStatus === 'blocked';
  const degraded = runtimeStatus === 'degraded' || agenticStatus === 'degraded';
  return {
    id: 'system-diagnostics',
    group: 'Diagnostics',
    label: 'System diagnostics',
    description: `${input.runtime?.summary ?? 'Runtime status'} / ${input.agenticSearch?.summary ?? 'research status'}`,
    href: '/app/settings?tab=system',
    icon: 'diagnostics',
    status: blocked ? 'blocked' : degraded ? 'degraded' : 'ok',
    meta: input.runtime?.checkedAt ? `Checked ${formatDate(input.runtime.checkedAt)}` : undefined,
  };
}

function degradedRow(id: string, group: SearchResultGroup, label: string, error: string): SearchResult {
  return {
    id,
    group,
    label,
    description: error,
    href: group === 'Diagnostics' ? '/app/settings?tab=system' : undefined,
    icon: 'degraded',
    status: 'degraded',
  };
}

async function readJson(fetchImpl: SearchFetch, url: string, group: SearchResultGroup): Promise<{ group: SearchResultGroup; data?: unknown; error?: string }> {
  try {
    const response = await fetchImpl(url);
    if (!response.ok) return { group, error: `HTTP ${response.status}` };
    return { group, data: await response.json() };
  } catch (error) {
    return { group, error: error instanceof Error ? error.message : String(error) };
  }
}

function errorFor(result: { group: SearchResultGroup; error?: string }): Partial<Record<SearchResultGroup, string>> {
  return result.error ? { [result.group]: result.error } : {};
}

function arrayFrom<T>(value: unknown, key: string): T[] {
  if (!isRecord(value)) return [];
  const nested = value[key];
  return Array.isArray(nested) ? nested as T[] : [];
}

function groupOrder(results: SearchResult[]): SearchResult[] {
  const order: SearchResultGroup[] = ['Ask', 'Commands', 'Conversations', 'Capsules', 'Sources', 'Diagnostics'];
  return results.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

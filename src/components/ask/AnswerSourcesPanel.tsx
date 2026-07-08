'use client';

import { ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SourceTierBadge } from '@/components/source/SourceTierBadge';
import { buildSourceGapScoutObjective } from '@/lib/agent-runtime/sourceability-ledger';
import type {
  AskAnswerEnvelope,
  CapsuleClaimLedgerItem,
  ClaimStatus,
  SourcePreviewCard,
} from '@/lib/ai/ask-answer-envelope';
import { cn } from '@/lib/utils/cn';

type ClaimPosture = 'supported' | 'partially' | 'unsupported' | 'disputed';

interface SourceEntry {
  key: string;
  entryId: string;
  cards: SourcePreviewCard[];
  ids: string[];
  title: string;
  label: string;
  url?: string;
  sourceReceiptHref?: string;
  publisher?: string;
  date?: string;
  reliabilityTier: SourcePreviewCard['reliabilityTier'];
  stale?: boolean;
  confidence: number;
  snippets: string[];
  locators: string[];
  claimCount: number;
}

interface ClaimChip {
  id: string;
  text: string;
  posture: ClaimPosture;
  sourceIds: string[];
  sourceEntryIds: string[];
  gapCandidate: boolean;
}

export interface AnswerSourcesPanelProps {
  envelope?: AskAnswerEnvelope;
  defaultExpanded?: boolean;
  onAction?: (prompt: string) => void;
  onQueueSourceGapScout?: (claims: string[]) => Promise<void> | void;
  onSourceEntryRequest?: (entryId: string) => void;
}

export function AnswerSourcesPanel({
  defaultExpanded = false,
  envelope,
  onAction,
  onQueueSourceGapScout,
  onSourceEntryRequest,
}: AnswerSourcesPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const model = useMemo(() => buildAnswerSourcesPanelModel(envelope), [envelope]);

  if (!model.visible) return null;

  const focusSourceEntry = (entryId: string) => {
    setActiveEntryId(entryId);
    onSourceEntryRequest?.(entryId);
    if (!onSourceEntryRequest && typeof document !== 'undefined') {
      document.getElementById(entryId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  return (
    <section
      className="praxis-shell-card mt-3 rounded-md border border-emerald-900/10 bg-[color:var(--color-archive-paper-strong)] p-3 text-sm text-slate-800"
      data-testid="answer-sources-panel"
      aria-label="Answer sources"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-900">Sources</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">{model.summaryLine}</p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="answer-sources-panel-body"
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex min-h-8 items-center gap-1 rounded-md border border-emerald-900/15 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {expanded ? 'Hide sources' : 'Show sources'}
        </button>
      </div>

      {expanded ? (
        <div id="answer-sources-panel-body" className="mt-3 space-y-3">
          <div className="grid gap-1.5">
            {model.commentaryLines.map((line) => (
              <p key={line} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs leading-5 text-slate-700">
                {line}
              </p>
            ))}
          </div>

          {model.gapClaims.length ? (
            <AnswerSourceGapChips
              claims={model.gapClaims}
              onAction={onAction}
              onQueueSourceGapScout={onQueueSourceGapScout}
            />
          ) : null}

          {model.claims.length ? (
            <div className="space-y-2" aria-label="Claim grounding">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Claim grounding</p>
              <div className="flex flex-wrap gap-1.5">
                {model.claims.map((claim) => (
                  <button
                    key={claim.id}
                    type="button"
                    disabled={!claim.sourceEntryIds.length}
                    onClick={() => {
                      if (claim.sourceEntryIds[0]) focusSourceEntry(claim.sourceEntryIds[0]);
                    }}
                    title={claim.text}
                    className={cn(
                      'inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-[11px] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40',
                      postureClassName(claim.posture),
                      !claim.sourceEntryIds.length && 'cursor-default opacity-85',
                    )}
                  >
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em]">{claim.posture}</span>
                    <span className="max-w-[18rem] truncate font-semibold">{claim.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {model.entries.length ? (
            <div className="grid gap-2">
              {model.entries.map((entry) => (
                <article
                  key={entry.key}
                  id={entry.entryId}
                  data-testid="answer-source-entry"
                  className={cn(
                    'scroll-mt-24 rounded-md border bg-white p-3 transition',
                    activeEntryId === entry.entryId
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                      : 'border-slate-200',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{entry.label}</p>
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 text-sm font-semibold text-diplomatic-blue hover:underline"
                        >
                          <span className="truncate">{entry.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <p className="mt-0.5 truncate text-sm font-semibold text-navy-950">{entry.title}</p>
                      )}
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {publisherDateLine(entry) || 'Publisher/date not attached'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      <SourceTierBadge tier={entry.reliabilityTier ?? null} date={entry.date ?? null} stale={entry.stale ?? null} showFreshness size="xs" />
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                      {entry.claimCount ? (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-900">
                          {entry.claimCount} claim{entry.claimCount === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {entry.snippets.length ? entry.snippets.map((snippet, index) => (
                      <SnippetBlock key={`${entry.key}:snippet:${index}`} snippet={snippet} />
                    )) : (
                      <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
                        No snippet field was attached to this source card.
                      </p>
                    )}
                  </div>

                  {entry.locators.length || entry.url || entry.sourceReceiptHref ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.locators.map((locator) => (
                        <span key={locator} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {locator}
                        </span>
                      ))}
                      {entry.url ? (
                        <span className="max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {entry.url}
                        </span>
                      ) : null}
                      {entry.sourceReceiptHref ? (
                        <a href={entry.sourceReceiptHref} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-diplomatic-blue hover:underline">
                          Source receipt
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900">
              No sources attached. Treat factual claims as ungrounded until a source gap is resolved.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function AnswerSourceGapChips({
  claims,
  onAction,
  onQueueSourceGapScout,
}: {
  claims: string[];
  onAction?: (prompt: string) => void;
  onQueueSourceGapScout?: (claims: string[]) => Promise<void> | void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Source gaps">
      {uniqueStrings(claims).map((claim) => (
        <button
          key={claim}
          type="button"
          onClick={() => {
            if (onQueueSourceGapScout) {
              void onQueueSourceGapScout([claim]);
              return;
            }
            onAction?.(buildSourceGapScoutObjective([claim]));
          }}
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-left text-[11px] font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <Search className="h-3 w-3 shrink-0" />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em]">Queue source-gap scout</span>
          <span className="max-w-[18rem] truncate">{claim}</span>
        </button>
      ))}
    </div>
  );
}

function SnippetBlock({ snippet }: { snippet: string }) {
  const cleaned = snippet.trim();
  if (cleaned.length <= 320) {
    return (
      <blockquote className="border-l-2 border-emerald-700/40 pl-2 text-xs leading-5 text-slate-700">
        {cleaned}
      </blockquote>
    );
  }
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
      <blockquote className="border-l-2 border-emerald-700/40 pl-2 text-xs leading-5 text-slate-700">
        {cleaned.slice(0, 320).trim()}...
      </blockquote>
      <details className="mt-1">
        <summary className="cursor-pointer text-[11px] font-semibold text-emerald-900">Show full snippet</summary>
        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{cleaned}</p>
      </details>
    </div>
  );
}

function buildAnswerSourcesPanelModel(envelope?: AskAnswerEnvelope) {
  const entries = buildSourceEntries(envelope?.sourceCards ?? []);
  const claims = buildClaimChips(envelope, entries);
  const docketGaps = envelope?.sourceRefreshDocket?.missingEvidenceGaps ?? [];
  const gapClaims = uniqueStrings([
    ...claims.filter((claim) => claim.gapCandidate).map((claim) => claim.text),
    ...docketGaps,
  ]);
  const visible = entries.length > 0 || claims.length > 0 || gapClaims.length > 0 || Boolean(envelope?.sourceabilityVerdicts?.length);

  return {
    visible,
    entries,
    claims,
    gapClaims,
    summaryLine: buildSummaryLine(envelope, entries, claims, gapClaims),
    commentaryLines: buildCommentaryLines(envelope, entries, claims, gapClaims),
  };
}

function buildSourceEntries(sourceCards: SourcePreviewCard[]): SourceEntry[] {
  const entries = new Map<string, SourceEntry>();
  for (const card of sourceCards) {
    const key = sourceDedupeKey(card);
    const existing = entries.get(key);
    if (existing) {
      existing.cards.push(card);
      existing.ids = uniqueStrings([...existing.ids, ...sourceIdsForCard(card)]);
      existing.snippets = uniqueStrings([...existing.snippets, card.quotePreview]);
      existing.locators = uniqueStrings([...existing.locators, ...locatorValues(card)]);
      existing.confidence = Math.max(existing.confidence, card.confidence ?? 0);
      existing.reliabilityTier = existing.reliabilityTier ?? card.reliabilityTier;
      existing.sourceReceiptHref = existing.sourceReceiptHref ?? card.sourceReceiptHref;
      existing.publisher = existing.publisher ?? card.publisher;
      existing.date = existing.date ?? card.date;
      existing.stale = existing.stale || card.stale;
      continue;
    }
    entries.set(key, {
      key,
      entryId: `answer-source-${stableHash(key)}`,
      cards: [card],
      ids: sourceIdsForCard(card),
      title: card.title,
      label: card.label,
      url: card.url,
      sourceReceiptHref: card.sourceReceiptHref,
      publisher: card.publisher,
      date: card.date,
      reliabilityTier: card.reliabilityTier ?? null,
      stale: card.stale,
      confidence: card.confidence ?? 0,
      snippets: uniqueStrings([card.quotePreview]),
      locators: locatorValues(card),
      claimCount: 0,
    });
  }
  return Array.from(entries.values());
}

function buildClaimChips(envelope: AskAnswerEnvelope | undefined, entries: SourceEntry[]): ClaimChip[] {
  const sourceToEntryIds = new Map<string, string[]>();
  for (const entry of entries) {
    for (const id of entry.ids) {
      sourceToEntryIds.set(id, [...(sourceToEntryIds.get(id) ?? []), entry.entryId]);
    }
  }

  const chips = new Map<string, ClaimChip>();
  for (const claim of envelope?.claimLedger ?? []) {
    chips.set(claim.claimId, chipFromLedgerClaim(claim, sourceToEntryIds));
  }
  for (const verdict of envelope?.sourceabilityVerdicts ?? []) {
    if (chips.has(verdict.claimId)) continue;
    chips.set(verdict.claimId, {
      id: verdict.claimId,
      text: verdict.claim,
      posture: postureForStatus(verdict.verdict),
      sourceIds: verdict.sourceIds,
      sourceEntryIds: uniqueStrings(verdict.sourceIds.flatMap((sourceId) => sourceToEntryIds.get(sourceId) ?? [])),
      gapCandidate: verdict.verdict === 'unsupported' || verdict.verdict === 'weak',
    });
  }

  const claims = Array.from(chips.values()).slice(0, 12);
  const sourceEntryClaimCounts = new Map<string, number>();
  for (const claim of claims) {
    for (const entryId of claim.sourceEntryIds) {
      sourceEntryClaimCounts.set(entryId, (sourceEntryClaimCounts.get(entryId) ?? 0) + 1);
    }
  }
  for (const entry of entries) {
    entry.claimCount = sourceEntryClaimCounts.get(entry.entryId) ?? 0;
  }
  return claims;
}

function chipFromLedgerClaim(claim: CapsuleClaimLedgerItem, sourceToEntryIds: Map<string, string[]>): ClaimChip {
  return {
    id: claim.claimId,
    text: claim.text,
    posture: postureForStatus(claim.status),
    sourceIds: claim.sourceIds,
    sourceEntryIds: uniqueStrings(claim.sourceIds.flatMap((sourceId) => sourceToEntryIds.get(sourceId) ?? [])),
    gapCandidate: claim.status === 'unsupported' || claim.status === 'weak',
  };
}

function buildSummaryLine(
  envelope: AskAnswerEnvelope | undefined,
  entries: SourceEntry[],
  claims: ClaimChip[],
  gapClaims: string[],
): string {
  if (!envelope) return 'No source envelope attached.';
  if (!entries.length && claims.length) return `No sources attached; ${claims.length} claim${claims.length === 1 ? '' : 's'} still need review.`;
  const sourceCount = envelope.sourceAudit?.sourceCount ?? entries.length;
  const receiptCount = envelope.sourceAudit?.sourceReceiptCount ?? entries.filter((entry) => entry.ids.some((id) => id.startsWith('receipt:'))).length;
  const tierLine = tierSummary(entries);
  const claimLine = claims.length
    ? `${claims.length} claim${claims.length === 1 ? '' : 's'} checked`
    : 'no claims checked';
  const gapLine = gapClaims.length
    ? `${gapClaims.length} source gap${gapClaims.length === 1 ? '' : 's'} visible`
    : 'no recorded source gaps';
  return `${sourceCount} source preview${sourceCount === 1 ? '' : 's'} (${receiptCount} receipt${receiptCount === 1 ? '' : 's'}); ${tierLine}; ${claimLine}; ${gapLine}.`;
}

function buildCommentaryLines(
  envelope: AskAnswerEnvelope | undefined,
  entries: SourceEntry[],
  claims: ClaimChip[],
  gapClaims: string[],
): string[] {
  if (!envelope) return ['No source envelope attached.'];
  const lines: string[] = [];
  const groups = new Map<string, SourceEntry[]>();
  for (const entry of entries) {
    groups.set(entry.cards[0]?.sourceType ?? 'source', [...(groups.get(entry.cards[0]?.sourceType ?? 'source') ?? []), entry]);
  }
  for (const [sourceType, groupEntries] of groups) {
    const linkedClaims = groupEntries.reduce((sum, entry) => sum + entry.claimCount, 0);
    lines.push(`${formatSourceType(sourceType)}: ${groupEntries.length} source${groupEntries.length === 1 ? '' : 's'}; ${tierSummary(groupEntries)}; ${linkedClaims} linked claim${linkedClaims === 1 ? '' : 's'}.`);
  }
  if (!entries.length) {
    lines.push('No sources attached.');
  }
  const audit = envelope.sourceAudit;
  if (audit) {
    lines.push(`Audit: ${audit.supportedClaimCount} supported, ${audit.weakClaimCount} weak, ${audit.unsupportedClaimCount} unsupported, ${audit.contradictedClaimCount} disputed; ${audit.sourcePosture.replace(/_/g, ' ')}.`);
  }
  if (entries.length === 1 && claims.length > 0) {
    lines.push('All linked claims rest on a single attached source.');
  }
  if (gapClaims.length > 0) {
    lines.push(`${gapClaims.length} unsupported or weak claim${gapClaims.length === 1 ? '' : 's'} should stay visible until sourced.`);
  }
  return uniqueStrings(lines);
}

function postureForStatus(status: ClaimStatus | 'weak' | 'supported' | 'unsupported' | 'contradicted'): ClaimPosture {
  if (status === 'supported') return 'supported';
  if (status === 'contradicted') return 'disputed';
  if (status === 'unsupported' || status === 'model_prior') return 'unsupported';
  return 'partially';
}

function postureClassName(posture: ClaimPosture): string {
  if (posture === 'supported') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (posture === 'disputed') return 'border-red-200 bg-red-50 text-red-900';
  if (posture === 'unsupported') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function sourceDedupeKey(card: SourcePreviewCard): string {
  return card.url?.trim().toLowerCase() || card.sourceReceiptId || card.id;
}

function sourceIdsForCard(card: SourcePreviewCard): string[] {
  return uniqueStrings([
    card.id,
    card.sourceReceiptId ?? '',
    card.sourceReceiptId ? `receipt:${card.sourceReceiptId}` : '',
    card.url ?? '',
  ]);
}

function locatorValues(card: SourcePreviewCard): string[] {
  return uniqueStrings([
    card.citationLabel ?? '',
    card.locatorLabel ?? '',
    card.pageRef ?? '',
    card.paragraphRef ?? '',
    card.chunkId ?? '',
    card.extractionFallbackLabel ?? '',
    card.sourceReceiptId ? `Source receipt: ${card.sourceReceiptId}` : '',
  ]);
}

function publisherDateLine(entry: SourceEntry): string {
  return [entry.publisher, entry.date].filter(Boolean).join(' / ');
}

function tierSummary(entries: SourceEntry[]): string {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const label = entry.reliabilityTier === 1
      ? 'tier-1 primary'
      : entry.reliabilityTier === 2
        ? 'tier-2'
        : entry.reliabilityTier === 3
          ? 'tier-3 commentary'
          : 'unrated';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (!counts.size) return 'no tiered sources';
  return Array.from(counts.entries())
    .map(([label, count]) => `${count} ${label}`)
    .join(', ');
}

function formatSourceType(value: string): string {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

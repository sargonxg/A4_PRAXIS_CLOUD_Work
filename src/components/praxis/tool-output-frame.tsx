'use client';

/**
 * <ToolOutputFrame /> — drop-in trust-layer wrapper for tool pages.
 *
 * Round-6 all-tools audit (`docs/MONSTER_TODO_2026-04-27.md` Brick #7) showed
 * that 48 of 52 tool pages do not render `<ConfidenceBadge />` /
 * `<DegradedDataChip />` / `<OutputProvenancePanel />` consistently — even
 * though all three primitives shipped in round 3 (Lane D). This wrapper
 * collapses the adoption pattern to a single import.
 *
 * Usage in any tool page (works whether or not the tool uses ToolPageShell):
 *
 *   <ToolOutputFrame
 *     toolId="risk-monitor"
 *     confidence={data?.confidence}
 *     generatedAt={data?.generatedAt}
 *     model={data?.model}
 *     profileVersion={data?.profileVersion}
 *     domainVersion={data?.domainVersion}
 *     primarySources={data?.primarySources}
 *     retrievalQuery={data?.retrievalQuery}
 *     retrievalLayers={data?.retrievalLayers}
 *     sourceCount={data?.sources?.length}
 *     degraded={liveDataMissing}
 *     missingFeeds={['ACLED', 'GDELT']}
 *   >
 *     <RiskOutputBody data={data} />
 *   </ToolOutputFrame>
 *
 * The frame renders nothing extra when the consumer passes nothing — it is
 * safe to drop in even before a tool's output schema carries provenance.
 */

import { ConfidenceBadge, type Confidence } from './confidence-badge';
import { DegradedDataChip } from './degraded-data-chip';
import { OutputProvenancePanel } from './output-provenance-panel';
import { cn } from '@/lib/utils/cn';

export interface ToolOutputFrameProps {
  /** Required — tool registry id (e.g. "risk-monitor"). */
  toolId: string;
  /** Output body rendered between the chip row and the provenance panel. */
  children: React.ReactNode;

  /** Top-of-frame confidence pill. Hidden when undefined. */
  confidence?: Confidence | string;
  /** Top-of-frame degraded-data chip. */
  degraded?: boolean;
  /** Names of feeds that returned empty (renders only when degraded=true). */
  missingFeeds?: string[];
  /** Optional override message for the degraded chip. */
  degradedMessage?: string;

  /** Provenance fields (see OutputProvenancePanelProps). All optional. */
  generatedAt?: string;
  profileVersion?: number;
  domainVersion?: number;
  model?: string;
  sourceCount?: number;
  primarySources?: string[];
  sourceReceipts?: unknown[];
  frameworks?: string[];
  calibratedTo?: string;
  retrievalQuery?: string;
  retrievalLayers?: string[];

  /** Hide the provenance panel even when fields are present. Default false. */
  hideProvenance?: boolean;
  /** Open the provenance panel by default. Default false. */
  provenanceDefaultOpen?: boolean;

  className?: string;
}

export function ToolOutputFrame({
  toolId,
  children,
  confidence,
  degraded,
  missingFeeds,
  degradedMessage,
  generatedAt,
  profileVersion,
  domainVersion,
  model,
  sourceCount,
  primarySources,
  sourceReceipts,
  frameworks,
  calibratedTo,
  retrievalQuery,
  retrievalLayers,
  hideProvenance = false,
  provenanceDefaultOpen = false,
  className,
}: ToolOutputFrameProps) {
  const hasChipRow = !!confidence || !!degraded;

  const hasProvenance =
    !!generatedAt ||
    typeof profileVersion === 'number' ||
    typeof domainVersion === 'number' ||
    !!model ||
    !!confidence ||
    typeof sourceCount === 'number' ||
    (primarySources && primarySources.length > 0) ||
    (sourceReceipts && sourceReceipts.length > 0) ||
    (frameworks && frameworks.length > 0) ||
    !!calibratedTo ||
    !!retrievalQuery ||
    (retrievalLayers && retrievalLayers.length > 0);

  return (
    <div className={cn('space-y-3', className)}>
      {hasChipRow && (
        <div className="flex flex-wrap items-center gap-2">
          {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
          {degraded ? (
            <DegradedDataChip
              degraded={degraded}
              missingFeeds={missingFeeds}
              message={degradedMessage}
              hideWhenHealthy={false}
            />
          ) : null}
        </div>
      )}
      {children}
      {!hideProvenance && hasProvenance ? (
        <OutputProvenancePanel
          toolId={toolId}
          generatedAt={generatedAt}
          profileVersion={profileVersion}
          domainVersion={domainVersion}
          model={model}
          confidence={confidence}
          sourceCount={sourceCount}
          primarySources={primarySources}
          sourceReceipts={sourceReceipts}
          frameworks={frameworks}
          calibratedTo={calibratedTo}
          retrievalQuery={retrievalQuery}
          retrievalLayers={retrievalLayers}
          defaultOpen={provenanceDefaultOpen}
        />
      ) : null}
    </div>
  );
}

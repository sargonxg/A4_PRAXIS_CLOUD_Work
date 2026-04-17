'use client';

/**
 * ToolPageShell — shared scaffold for tool pages that follow the standard pattern:
 *   useSituationGuard → useToolData → NoSituationState guard → AiPopulate → demo component
 *
 * Handles: demo bypass, guard, AiPopulate wrapping, RegistryToolInfo.
 * The tool supplies: a demo renderer, optional extra API body, optional onDataGenerated.
 *
 * Usage:
 *   <ToolPageShell
 *     toolId="early-warning"
 *     toolName="Early Warning"
 *     toolDataKey="early_warning"
 *     apiEndpoint="/api/ai/risk-assessment"
 *     creditCost={3}
 *     buildExtraBody={(situation) => ({ regions: [situation.region] })}
 *     onDataGenerated={(data, setExtra) => { ... }}
 *     renderDemo={(situation, extra) => <DemoPage situation={situation} data={extra} />}
 *     renderEmpty={(situation) => <EmptyState />}
 *   />
 */

import { useState } from 'react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import type { Situation } from '@/types/situation';
import type { ToolName } from '@/lib/services/tool-data-service';

export interface ToolPageShellProps {
  /** Registry tool ID (e.g. "early-warning") */
  toolId: string;
  /** Human-readable tool name shown in AiPopulate prompt */
  toolName: string;
  /** Key used to look up persisted tool data in Firestore (e.g. "early_warning") */
  toolDataKey: ToolName;
  /** API endpoint called when generating or regenerating */
  apiEndpoint: string;
  /** Credits deducted when generating */
  creditCost: number;
  /**
   * Extra body fields appended to the POST payload.
   * Receives the active situation so you can derive fields from it.
   */
  buildExtraBody?: (situation: Situation) => Record<string, unknown>;
  /**
   * Called after AiPopulate receives a successful response.
   * Use setExtra to surface the generated data to the demo renderer.
   */
  onDataGenerated?: (data: unknown, setExtra: (v: unknown) => void) => void;
  /**
   * Render the main tool content.
   * - `situation` is null in demo mode; non-null in real mode.
   * - `extra` holds any data passed via `onDataGenerated` → setExtra.
   */
  renderDemo: (situation: Situation | null, extra: unknown) => React.ReactNode;
  /**
   * Render the empty/pending state shown inside AiPopulate before data exists.
   * Defaults to null (AiPopulate shows its own prompt above the empty children).
   */
  renderEmpty?: (situation: Situation) => React.ReactNode;
  /** Whether to show RegistryToolInfo panel (default: true) */
  showRegistryInfo?: boolean;
}

export function ToolPageShell({
  toolId,
  toolName,
  toolDataKey,
  apiEndpoint,
  creditCost,
  buildExtraBody,
  onDataGenerated,
  renderDemo,
  renderEmpty,
  showRegistryInfo = true,
}: ToolPageShellProps) {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const { hasData, loading: firestoreLoading } = useToolData(toolDataKey);
  const [extra, setExtra] = useState<unknown>(null);

  // ── Demo mode: pass null situation and any extra state ──────────────────────
  if (isDemo) {
    return <>{renderDemo(null, extra)}</>;
  }

  // ── No situation guard ──────────────────────────────────────────────────────
  if (showGuard || !situation) {
    return <NoSituationState />;
  }

  // ── Real mode ───────────────────────────────────────────────────────────────
  const extraBody = buildExtraBody ? buildExtraBody(situation) : undefined;

  const handleDataGenerated = (data: unknown) => {
    if (onDataGenerated) {
      onDataGenerated(data, setExtra);
    } else {
      setExtra(data);
    }
  };

  return (
    <div className="space-y-4">
      {showRegistryInfo && <RegistryToolInfo toolId={toolId} />}
      <AiPopulate
        toolId={toolId}
        toolName={toolName}
        apiEndpoint={apiEndpoint}
        creditCost={creditCost}
        hasExistingData={hasData || firestoreLoading}
        extraBody={extraBody}
        onDataGenerated={handleDataGenerated}
      >
        {extra != null
          ? renderDemo(situation, extra)
          : renderEmpty
            ? renderEmpty(situation)
            : renderDemo(situation, null)}
      </AiPopulate>
    </div>
  );
}

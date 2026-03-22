'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';
import type { Situation } from '@/types/situation';

interface ToolPageWrapperProps {
  /** Unique tool identifier */
  toolId: string;
  /** Human-readable tool name */
  toolName: string;
  /** API endpoint for AI generation */
  apiEndpoint: string;
  /** Credit cost */
  creditCost: number;
  /** Whether situation has data for this tool already */
  hasData?: boolean;
  /** Render function for demo mode — receives no situation, uses demo constants */
  renderDemo: () => React.ReactNode;
  /** Render function for real mode — receives the active situation */
  renderReal: (situation: Situation, data: unknown | null) => React.ReactNode;
}

/**
 * Universal wrapper for all tool pages.
 *
 * Handles:
 * - Demo mode: renders demo version with hardcoded data
 * - Real mode without situation: shows NoSituationState
 * - Real mode with situation but no data: shows AiPopulate prompt
 * - Real mode with data: renders real tool
 */
export function ToolPageWrapper({
  toolId,
  toolName,
  apiEndpoint,
  creditCost,
  hasData = false,
  renderDemo,
  renderReal,
}: ToolPageWrapperProps) {
  const { isDemo, showGuard, situation } = useSituationGuard();

  // Demo mode — use existing hardcoded data
  if (isDemo) {
    return <>{renderDemo()}</>;
  }

  // No situation selected
  if (showGuard || !situation) {
    return <NoSituationState />;
  }

  // Real mode — wrap with AiPopulate for auto-generation
  return (
    <AiPopulate
      toolId={toolId}
      toolName={toolName}
      apiEndpoint={apiEndpoint}
      creditCost={creditCost}
      hasExistingData={hasData}
      onDataGenerated={() => {
        // Data generated — the tool will reload from Firestore
      }}
    >
      {renderReal(situation, null)}
    </AiPopulate>
  );
}

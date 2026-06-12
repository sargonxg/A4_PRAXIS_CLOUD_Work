'use client';

import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleTacitKnowledgeSection = memo(function CapsuleTacitKnowledgeSection({
  tacitKnowledge,
}: {
  tacitKnowledge: CapsuleWorkbenchViewModel['tacitKnowledge'];
}) {
  return (
    <WorkbenchSection title="Tacit Knowledge" icon={Sparkles}>
      <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-semibold">
        <StatePill state="canonical" label={`${tacitKnowledge.contextReadyCount} context-ready`} />
        <StatePill state="advisory" label={`Advisory memory ${tacitKnowledge.advisoryCount}`} />
      </div>
      <CompactList
        items={tacitKnowledge.items.length
          ? tacitKnowledge.items.map((item) => `${item.type}: ${item.summary}`)
          : ['No tacit knowledge cards yet. Add reviewer caveats, decisions, assumptions, or handover notes.']}
        empty="No tacit knowledge cards yet."
      />
    </WorkbenchSection>
  );
});

'use client';

import { memo } from 'react';
import { FileText } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleOutputsSection = memo(function CapsuleOutputsSection({ outputs }: { outputs: CapsuleWorkbenchViewModel['outputs'] }) {
  return (
    <WorkbenchSection title="Outputs" icon={FileText}>
      <CompactList
        items={outputs.length ? outputs.map((output) => `${output.type}: ${output.label}`) : ['No memo, brief, handover, or output capsule is attached yet.']}
        empty="No outputs attached yet."
      />
    </WorkbenchSection>
  );
});

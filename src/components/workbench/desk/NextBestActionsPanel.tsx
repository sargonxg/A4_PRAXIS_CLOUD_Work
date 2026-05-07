import { SurfaceActionList, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import type { SurfaceAction } from '@/lib/workbench/surface-state';

export function NextBestActionsPanel({ actions }: { actions: SurfaceAction[] }) {
  return (
    <SurfaceSection eyebrow="Next best actions" title="Recommended operating moves">
      <SurfaceActionList actions={actions} />
    </SurfaceSection>
  );
}

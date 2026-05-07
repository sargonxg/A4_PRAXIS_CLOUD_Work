import { SurfaceFactGrid, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import type { SurfaceFact } from '@/lib/workbench/surface-state';

export function WhatChangedPanel({ facts }: { facts: SurfaceFact[] }) {
  return (
    <SurfaceSection eyebrow="What changed" title="Latest case signals">
      <SurfaceFactGrid facts={facts} />
    </SurfaceSection>
  );
}

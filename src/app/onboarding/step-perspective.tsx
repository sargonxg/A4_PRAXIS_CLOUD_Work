'use client';
import type { AnalystProfile } from '@/types/analyst-profile';
// TODO T18: replace with real Perspective step
export function StepPerspective(_props: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return <div>Perspective step — T18 pending</div>;
}

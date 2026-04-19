'use client';
import type { AnalystProfile } from '@/types/analyst-profile';
// TODO T19: replace with real Working Style step
export function StepWorkingStyle(_props: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return <div>Working Style step — T19 pending</div>;
}

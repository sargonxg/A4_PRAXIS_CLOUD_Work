'use client';
import type { AnalystProfile } from '@/types/analyst-profile';
// TODO T17: replace with real Identity step
export function StepIdentity(_props: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  saving: boolean;
}) {
  return <div>Identity step — T17 pending</div>;
}

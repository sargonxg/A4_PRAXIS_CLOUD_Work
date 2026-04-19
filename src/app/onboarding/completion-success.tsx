'use client';
import type { AnalystProfile } from '@/types/analyst-profile';
// TODO T20: replace with real Completion screen
export function CompletionSuccess(_props: {
  profile: AnalystProfile;
  onComplete: (createFirstSituation: boolean) => void;
}) {
  return <div>Completion — T20 pending</div>;
}

"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { NoSituationState } from "@/components/praxis/no-situation-state";
import { OnboardingRequiredState } from "@/components/praxis/onboarding-required-state";

import { ChatInterface } from "@/components/assistant/chat-interface";

export default function AssistantPage() {
  const { showGuard, needsOnboarding } = useSituationGuard();
  if (needsOnboarding) return <OnboardingRequiredState />;
  if (showGuard) return <NoSituationState />;
  return (
    <div className="-mx-6 -my-6 h-[calc(100vh-4rem)]">
      <ChatInterface />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Shown on tool pages when the authenticated user has not yet completed
 * the AnalystProfile onboarding wizard. Tools are gated until the profile
 * is finished so that every AI output is calibrated to the analyst's
 * mandate, lens, audience, and red lines.
 */
export function OnboardingRequiredState() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md w-full rounded-xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-[#E8B931]/10 p-4">
            <Sparkles className="h-8 w-8 text-[#E8B931]" aria-hidden="true" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="font-serif text-xl font-semibold text-white">
            Complete your analyst profile
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            PRAXIS tools calibrate to your mandate, lens, audience, and red lines.
            Complete the 3-minute profile first so every output is shaped for your work.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#10B981]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
          >
            Continue onboarding
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

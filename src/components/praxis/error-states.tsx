'use client';

import { AlertTriangle, CreditCard, RefreshCw, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NoCreditsError() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
        <CreditCard className="h-7 w-7 text-amber-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">No Credits Remaining</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
        Your workspace has reached its current usage limit. Upgrade your plan or contact TACITUS to increase capacity.
      </p>
    </div>
  );
}

export function AIServiceError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">AI Service Unavailable</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
        The AI service is temporarily unavailable. Please try again.
      </p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90">
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}

export function AuthExpiredError() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-100">
        <LogIn className="h-7 w-7 text-navy-600" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">Session Expired</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-navy-500">Your session has expired. Please sign in again.</p>
      <button onClick={() => router.push('/login')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400">
        <LogIn className="h-4 w-4" /> Sign In
      </button>
    </div>
  );
}

export function SituationNotFoundError() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-100">
        <AlertTriangle className="h-7 w-7 text-navy-500" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">Situation Not Found</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
        This situation doesn&apos;t exist or was deleted.
      </p>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { Globe, Plus } from 'lucide-react';

export function NoSituationState() {
  const router = useRouter();
  const route = usePraxisRoute();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-diplomatic-blue/10">
        <Globe className="h-8 w-8 text-diplomatic-blue" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-navy-900">No situation selected</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-navy-500">
        Select or create a situation to use this tool. All data in PRAXIS is organized by situation.
      </p>
      <button
        onClick={() => router.push(route('/situations/new'))}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
      >
        <Plus className="h-4 w-4" />
        Create New Situation
      </button>
    </div>
  );
}

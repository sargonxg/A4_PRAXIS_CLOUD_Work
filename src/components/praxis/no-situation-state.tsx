'use client';

import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { Globe, Plus, ArrowRight, FileText, Shield, Users } from 'lucide-react';

export function NoSituationState() {
  const router = useRouter();
  const route = usePraxisRoute();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-diplomatic-blue/10 border border-diplomatic-blue/20">
        <Globe className="h-10 w-10 text-diplomatic-blue" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-navy-900">No situation selected</h2>
      <p className="mt-2 max-w-md text-center text-sm text-navy-500">
        Create a situation to unlock all PRAXIS tools. Each situation organizes your intelligence, analysis, and reports around a specific conflict or scenario.
      </p>

      <button
        onClick={() => router.push(route('/situations/new'))}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20"
      >
        <Plus className="h-4 w-4" />
        Create New Situation
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* What you get */}
      <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <FileText className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">AI-Generated Reports</p>
          <p className="mt-0.5 text-[10px] text-navy-400">Briefings, dossiers, memos</p>
        </div>
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <Shield className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">Risk Assessment</p>
          <p className="mt-0.5 text-[10px] text-navy-400">INFORM index, Glasl staging</p>
        </div>
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <Users className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">Actor Intelligence</p>
          <p className="mt-0.5 text-[10px] text-navy-400">Profiles, networks, mapping</p>
        </div>
      </div>
    </div>
  );
}

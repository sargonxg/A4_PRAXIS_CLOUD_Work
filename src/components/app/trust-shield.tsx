'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { TrustDrawer } from '@/components/praxis/trust-drawer';

export function TrustShield() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:border-emerald-500/40 hover:bg-emerald-100"
        aria-label="Open trust posture"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Trust</span>
      </button>
      <TrustDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

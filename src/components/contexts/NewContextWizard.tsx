'use client';

import { useState } from 'react';

export function NewContextWizard() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="h-10 border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white">+ New Context</button>
      {open ? (
        <div className="mt-3 border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input className="h-10 border border-slate-300 px-3 text-sm" placeholder="Name" />
            <input className="h-10 border border-slate-300 px-3 text-sm" placeholder="Primary domain" />
            <select className="h-10 border border-slate-300 px-3 text-sm" defaultValue="foreign-policy-research">
              <option value="foreign-policy-research">Foreign Policy Research</option>
              <option value="domestic-policy-analysis">Domestic Policy Analysis</option>
              <option value="corporate-strategic-analysis">Corporate Strategic Analysis</option>
            </select>
            <button type="button" className="h-10 border border-slate-300 px-3 text-sm text-slate-600">Create after auth</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

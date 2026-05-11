'use client';

import { FileUp, Link2 } from 'lucide-react';

export function FileAttachment({ onRoute }: { onRoute: (message: string) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onRoute('Document upload will route through the owner-scoped document pipeline when authentication is available.')}
        className="flex min-h-16 items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-navy-700 hover:border-navy-300 hover:bg-white"
      >
        <FileUp className="h-4 w-4 shrink-0 text-navy-600" />
        Drop or choose document
      </button>
      <button
        type="button"
        onClick={() => onRoute('Pasted URLs are treated as source candidates and require provenance review before use.')}
        className="flex min-h-16 items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-left text-sm text-navy-700 hover:border-navy-300 hover:bg-white"
      >
        <Link2 className="h-4 w-4 shrink-0 text-navy-600" />
        Paste source URL
      </button>
    </div>
  );
}

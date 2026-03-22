'use client';

import { Loader2, Search, FileText, Sparkles } from 'lucide-react';

export function PraxisThinking() {
  return (
    <div className="flex items-center gap-3 py-4">
      <Loader2 className="h-5 w-5 animate-spin text-diplomatic-blue" />
      <span className="text-sm text-navy-600">PRAXIS is analyzing...</span>
    </div>
  );
}

export function PraxisResearching({ sourceCount }: { sourceCount?: number }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Search className="h-5 w-5 animate-pulse text-gold-600" />
      <span className="text-sm text-navy-600">
        Searching sources{sourceCount ? ` (${sourceCount} found)` : ''}...
      </span>
    </div>
  );
}

export function PraxisExtracting({ progress }: { progress?: number }) {
  return (
    <div className="space-y-2 py-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 animate-pulse text-diplomatic-blue" />
        <span className="text-sm text-navy-600">Extracting conflict grammar entities...</span>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-diplomatic-blue transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function PraxisGenerating({ type }: { type: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Sparkles className="h-5 w-5 animate-pulse text-gold-600" />
      <span className="text-sm text-navy-600">Generating {type}...</span>
    </div>
  );
}

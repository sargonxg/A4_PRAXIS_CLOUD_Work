import { Sparkles } from 'lucide-react';
import { getMethodSuggestions } from '@/lib/methods/catalog';
import { MethodCard } from '@/components/methods/MethodCard';

export function SuggestionStrip({ query, hasContext }: { query: string; hasContext: boolean }) {
  const suggestions = getMethodSuggestions({ query, hasContext });

  return (
    <section className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-700" />
          <h2 className="text-sm font-semibold text-navy-900">Suggested methods</h2>
        </div>
        <span className="text-xs text-navy-600">{hasContext ? 'Using active context signal' : 'General suggestions'}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.method.id} className="flex flex-col gap-2">
            <MethodCard method={suggestion.method} compact />
            <p className="px-1 text-xs leading-relaxed text-navy-600">{suggestion.rationale}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

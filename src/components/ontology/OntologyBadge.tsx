import { Boxes } from 'lucide-react';
import type { CaseOntologyDefinition } from '@/lib/ontology/types';

export function OntologyBadge({ ontology }: { ontology: CaseOntologyDefinition }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-xs font-semibold text-navy-900">
      <Boxes className="h-4 w-4 text-gold-700" />
      <span>{ontology.label}</span>
    </div>
  );
}

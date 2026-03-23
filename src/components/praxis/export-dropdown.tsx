'use client';

import { useState } from 'react';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';

interface ExportOption {
  label: string;
  type: string;
  icon: React.ElementType;
  format: string;
}

interface ExportDropdownProps {
  options?: ExportOption[];
  getContent: () => Record<string, unknown>;
}

const DEFAULT_OPTIONS: ExportOption[] = [
  { label: 'Situation Report (DOCX)', type: 'situation-report', icon: FileText, format: 'docx' },
  { label: 'Timeline (CSV)', type: 'timeline-csv', icon: Table, format: 'csv' },
  { label: 'Knowledge Graph (JSON)', type: 'conflict-grammar-json', icon: FileText, format: 'json' },
];

export function ExportDropdown({ options = DEFAULT_OPTIONS, getContent }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const { activeSituation } = useSituationStore();

  const handleExport = async (option: ExportOption) => {
    if (!activeSituation) return;
    setExporting(option.type);

    try {
      const content = getContent();
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: option.type, situation: activeSituation, content }),
      });

      if (!res.ok) {
        console.error('Export failed:', await res.text());
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') || `export.${option.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-navy-200 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.type}
                onClick={() => handleExport(opt)}
                disabled={!!exporting}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors',
                  exporting === opt.type ? 'bg-navy-50 text-navy-400' : 'text-navy-700 hover:bg-navy-50'
                )}
              >
                {exporting === opt.type ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <opt.icon className="h-3.5 w-3.5 text-navy-400" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

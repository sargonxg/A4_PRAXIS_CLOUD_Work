import { Download, FileArchive } from 'lucide-react';
import type { DraftExportSettings, DraftFormat } from '@/lib/workbench/draft-assembly-state';

interface ExportControlsProps {
  settings: DraftExportSettings;
  disabled: boolean;
  exportSummary: string;
  onSettingsChange: (settings: DraftExportSettings) => void;
  onExport: () => Promise<void>;
}

const FORMATS: Array<{ id: DraftFormat; label: string }> = [
  { id: 'markdown', label: 'Markdown' },
  { id: 'docx', label: 'DOCX' },
  { id: 'pdf', label: 'PDF' },
];

export function ExportControls({
  settings,
  disabled,
  exportSummary,
  onSettingsChange,
  onExport,
}: ExportControlsProps) {
  const update = (next: Partial<DraftExportSettings>) => onSettingsChange({ ...settings, ...next });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <FileArchive className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <h3 className="text-base font-semibold text-navy-950">Export Controls</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Package the selected memos, cover page, appendices, redaction rules, and verification manifest into a briefing artifact.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <label>
          <span className="text-xs font-semibold text-navy-800">Format</span>
          <select
            value={settings.format}
            onChange={(event) => update({ format: event.target.value as DraftFormat })}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          >
            {FORMATS.map((format) => <option key={format.id} value={format.id}>{format.label}</option>)}
          </select>
        </label>
        <div className="grid gap-2">
          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <input
              type="checkbox"
              checked={settings.embedC2pa}
              onChange={(event) => update({ embedC2pa: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-diplomatic-blue"
            />
            <span>
              <span className="block text-sm font-semibold text-navy-950">Embed content-credential manifest</span>
              <span className="mt-1 block text-xs leading-5 text-slate-700">Writes a package manifest now; server signing remains tracked for the production export backend.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <input
              type="checkbox"
              checked={settings.embedAuditManifest}
              onChange={(event) => update({ embedAuditManifest: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-diplomatic-blue"
            />
            <span>
              <span className="block text-sm font-semibold text-navy-950">Embed audit-trail manifest</span>
              <span className="mt-1 block text-xs leading-5 text-slate-700">Includes memo ids, appendix ids, export audience, and package timestamp for review.</span>
            </span>
          </label>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-4 py-3">
        <p className="text-xs font-medium leading-5 text-navy-800">{exportSummary}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onExport()}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-sm shadow-gold-500/20 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export package
        </button>
      </div>
    </section>
  );
}

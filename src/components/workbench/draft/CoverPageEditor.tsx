import { IdCard } from 'lucide-react';
import type { DraftCoverPage } from '@/lib/workbench/draft-assembly-state';

interface CoverPageEditorProps {
  value: DraftCoverPage;
  onChange: (value: DraftCoverPage) => void;
}

export function CoverPageEditor({ value, onChange }: CoverPageEditorProps) {
  const update = (field: keyof DraftCoverPage, next: string) => onChange({ ...value, [field]: next });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <IdCard className="mt-0.5 h-5 w-5 text-gold-600" />
        <div>
          <h3 className="text-base font-semibold text-navy-950">Cover Page</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Set the audience-facing framing before export. The preview mirrors what is written into the briefing package.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Title" value={value.title} onChange={(next) => update('title', next)} />
        <Field label="Author" value={value.author} onChange={(next) => update('author', next)} />
        <Field label="Classification" value={value.classification} onChange={(next) => update('classification', next)} />
        <Field label="Distribution" value={value.distribution} onChange={(next) => update('distribution', next)} />
        <Field label="Version" value={value.version} onChange={(next) => update('version', next)} />
        <Field label="Date" type="date" value={value.date} onChange={(next) => update('date', next)} />
        <label className="md:col-span-2">
          <span className="text-xs font-semibold text-navy-800">Subtitle</span>
          <textarea
            value={value.subtitle}
            onChange={(event) => update('subtitle', event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 placeholder:text-slate-500 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          />
        </label>
      </div>
      <div className="mt-4 rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-diplomatic-blue">Live cover preview</p>
        <p className="mt-2 text-lg font-semibold text-navy-950">{value.title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{value.subtitle}</p>
        <p className="mt-3 text-xs font-medium text-slate-700">
          {value.classification} · {value.distribution} · {value.version} · {value.date}
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-semibold text-navy-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 placeholder:text-slate-500 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
      />
    </label>
  );
}

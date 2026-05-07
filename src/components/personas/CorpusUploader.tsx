'use client';

export interface CorpusEntryDraft {
  title: string;
  citation: string;
  license: string;
}

export function CorpusUploader({
  entries,
  onChange,
}: {
  entries: CorpusEntryDraft[];
  onChange: (entries: CorpusEntryDraft[]) => void;
}) {
  function update(index: number, key: keyof CorpusEntryDraft, value: string) {
    onChange(entries.map((entry, itemIndex) => (itemIndex === index ? { ...entry, [key]: value } : entry)));
  }

  function addEntry() {
    onChange([...entries, { title: '', citation: '', license: 'workspace-restricted' }]);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy-950">Corpus manifest</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">Capture citation metadata first; binary upload and chunking remain behind the workspace ingestion job.</p>
        </div>
        <button type="button" onClick={addEntry} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-950">
          Add source
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
            <input value={entry.title} onChange={(event) => update(index, 'title', event.target.value)} placeholder="Title" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
            <input value={entry.citation} onChange={(event) => update(index, 'citation', event.target.value)} placeholder="Citation" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
            <input value={entry.license} onChange={(event) => update(index, 'license', event.target.value)} placeholder="License" className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

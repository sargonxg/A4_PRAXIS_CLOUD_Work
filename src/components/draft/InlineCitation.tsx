'use client';

export function InlineCitation({ label, sourceId, confidence = 0.72 }: { label: string; sourceId: string; confidence?: number }) {
  return (
    <span
      title={`${label} · ${sourceId} · confidence ${Math.round(confidence * 100)}%`}
      className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700"
    >
      [{label}]
    </span>
  );
}

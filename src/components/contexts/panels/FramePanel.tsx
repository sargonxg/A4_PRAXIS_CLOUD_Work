import type { CaseModule } from '@/types/case-module';

export function FramePanel({ caseModule }: { caseModule: CaseModule }) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">Frame</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ['Name', caseModule.manifest.name],
          ['Region', caseModule.manifest.region],
          ['Domain', caseModule.manifest.domain],
          ['Summary', caseModule.manifest.summary],
        ].map(([label, value]) => (
          <label key={label} className="grid gap-1 text-sm">
            <span className="font-medium text-slate-600">{label}</span>
            <textarea className="min-h-16 border border-slate-300 bg-white p-3" defaultValue={value} readOnly />
          </label>
        ))}
      </div>
      <div className="border border-slate-200 bg-white p-4 text-sm">Frame health: ready for sources and work-process refinement.</div>
    </section>
  );
}

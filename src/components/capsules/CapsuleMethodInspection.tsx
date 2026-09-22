/** Renders the saved method, not a replacement fetched from today's catalog. */
export function CapsuleMethodInspection({ snapshot }: { snapshot: unknown }) {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const saved = snapshot as Record<string, unknown>;
  if (!saved.deviceProfile || typeof saved.deviceProfile !== 'object') return null;
  const method = saved.deviceProfile as Record<string, unknown>;
  const sections = Array.isArray(saved.inspectionSections) ? saved.inspectionSections : [];
  const graph = sections.find((section) => section?.label === 'Method graph and ontology');
  const lists = [
    ['Required inputs', method.inputContract],
    ['Procedure', method.methodSteps],
    ['Challenge the result', method.disconfirmingChecks],
  ] as const;
  return (
    <details className="rounded-md border border-emerald-200 bg-emerald-50/30 p-3" data-testid="capsule-method-inspection">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Inspect the analytical method</summary>
      <p className="mt-3 text-sm font-medium">{typeof method.reasoningOperation === 'string' ? method.reasoningOperation : 'Saved method'}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">This is a reasoning guide, not evidence or a guarantee of correctness. Review its fit to your question.</p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {lists.map(([label, items]) => (
          <div key={label}>
            <h4 className="text-xs font-semibold text-slate-900">{label}</h4>
            <ol className="mt-2 list-decimal space-y-2 pl-4 text-xs leading-5 text-slate-700">
              {strings(items).map((item, index) => <li key={index}>{item}</li>)}
            </ol>
          </div>
        ))}
      </div>
      {typeof graph?.detail === 'string' ? <p className="mt-4 whitespace-pre-line text-xs leading-5 text-slate-700"><strong>Graph and ontology template: </strong>{graph.detail}</p> : null}
      <div className="mt-3 space-y-2 break-words text-xs leading-5 text-slate-600">
        {strings(method.sourceabilityRequirements).map((reference, index) => <p key={index}>{reference}</p>)}
      </div>
      {typeof method.humanReviewGate === 'string' ? <p className="mt-3 text-xs leading-5 text-amber-900">{method.humanReviewGate}</p> : null}
    </details>
  );
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

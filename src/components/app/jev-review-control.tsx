'use client';

/** Optional provider boundary. Do not enable from a client flag or an API key alone. */
export function JevReviewControl() {
  return (
    <details className="max-w-full rounded-md border border-slate-200 bg-white text-xs text-slate-700" data-testid="jev-review-control">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 font-semibold">
        JEV review <span className="font-normal text-slate-500">Not connected</span>
      </summary>
      <div className="max-w-sm space-y-2 border-t border-slate-100 p-3 leading-5">
        <p>Optional structured checks for claims and evidence. Provider setup and validation are still required; standard PRAXIS analysis remains available.</p>
        <label className="flex min-h-11 items-center gap-2 text-slate-500">
          <input type="checkbox" disabled checked={false} readOnly /> Use JEV for this turn
        </label>
        <p>No content is sent to TypeSafe. Future checks will require your explicit selection and will not replace source inspection or human review.</p>
      </div>
    </details>
  );
}

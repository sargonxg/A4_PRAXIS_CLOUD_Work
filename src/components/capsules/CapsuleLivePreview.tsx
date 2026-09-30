'use client';

import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';

type CapsuleLivePreviewProps = {
  json: string;
};

export function CapsuleLivePreview({ json }: CapsuleLivePreviewProps) {
  const parsedJson = safeJson(json);
  const parsed = parsedJson.ok ? ContextCapsuleSchema.safeParse(parsedJson.value) : null;
  const capsule = parsed?.success ? parsed.data : null;
  const issues = parsedJson.ok
    ? parsed && !parsed.success
      ? parsed.error.issues.map((issue) => `${issue.path.join('.') || 'capsule'}: ${issue.message}`)
      : []
    : [parsedJson.error];

  return (
    <aside className="specimen-card min-w-0 rounded-lg border border-[var(--color-mineral)] bg-[var(--color-archive-paper-strong)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-graphite)]">Live preview</p>
      {capsule ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[var(--color-deep-ink)]">Your working context</h3>
            <p className="mt-2 break-words text-sm leading-6 text-[var(--color-graphite)]">{capsule.persona.systemFrame}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--color-graphite)]">Domain</dt>
              <dd className="font-medium">{readable(capsule.persona.domain)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-graphite)]">Output</dt>
              <dd className="font-medium">{readable(capsule.output.format)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-graphite)]">Sources</dt>
              <dd className="font-medium">{readable(capsule.sourcing.mode)}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-graphite)]">Guardrail</dt>
              <dd className="font-medium">
                {capsule.guardrails.citationRequired ? 'Citations required' : 'Citations advised'}
              </dd>
            </div>
          </dl>
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Technical details</summary>
            <p className="break-all font-mono text-xs text-[var(--color-graphite)]">{capsule.id}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-graphite)]">Frameworks</p>
            <p className="mt-2 text-sm text-[var(--color-graphite)]">
              {capsule.persona.frameworks.length ? capsule.persona.frameworks.map(readable).join(', ') : 'No frameworks selected yet'}
            </p>
          </details>
          <p className="border-t border-[var(--color-mineral)] pt-3 text-xs leading-5 text-[var(--color-graphite)]">This preview describes draft settings. It does not verify sources or approve generated claims.</p>
        </div>
      ) : (
        <div role="status" className="mt-4 space-y-2 break-words text-sm text-[var(--color-oxide)]">
          {issues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      )}
    </aside>
  );
}

function safeJson(value: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(value) as unknown };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}

function readable(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/^./, (first) => first.toUpperCase());
}

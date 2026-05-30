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
    <aside className="border border-[#d8d1c5] bg-[#fffdf8] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#786f62]">Live preview</p>
      {capsule ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#24211b]">{capsule.id}</h3>
            <p className="text-sm text-[#5b5347]">{capsule.persona.systemFrame}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#786f62]">Domain</dt>
              <dd className="font-medium">{capsule.persona.domain}</dd>
            </div>
            <div>
              <dt className="text-[#786f62]">Output</dt>
              <dd className="font-medium">{capsule.output.format}</dd>
            </div>
            <div>
              <dt className="text-[#786f62]">Sources</dt>
              <dd className="font-medium">{capsule.sourcing.mode}</dd>
            </div>
            <div>
              <dt className="text-[#786f62]">Guardrail</dt>
              <dd className="font-medium">
                {capsule.guardrails.citationRequired ? 'Citations required' : 'Citations advised'}
              </dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#786f62]">Frameworks</p>
            <p className="mt-2 text-sm text-[#4f483f]">
              {capsule.persona.frameworks.length ? capsule.persona.frameworks.join(', ') : 'No frameworks selected yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-[#8a3d2c]">
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

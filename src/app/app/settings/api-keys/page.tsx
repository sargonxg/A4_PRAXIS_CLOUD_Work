'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ExternalLink, Loader2, ShieldCheck, Trash2, X } from 'lucide-react';
import type { ProviderId, ProviderSpec, ProviderCategory } from '@/lib/providers/registry';

interface ProviderKeyStatus {
  provider: ProviderId;
  present: boolean;
  maskedPreview: string;
  nonSecretValues: Record<string, string>;
  validatedAt: string | null;
  validationError: string | null;
  updatedAt: string | null;
  platformFallbackAvailable: boolean;
  effective: boolean;
}

interface ApiResponse {
  providers: Record<ProviderId, ProviderSpec>;
  statuses: Record<ProviderId, ProviderKeyStatus>;
}

const CATEGORY_ORDER: ProviderCategory[] = ['ai', 'feed'];
const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  ai: 'AI Models',
  feed: 'Conflict & Humanitarian Feeds',
};
const CATEGORY_BLURBS: Record<ProviderCategory, string> = {
  ai: 'The reasoning engines that drive every PRAXIS tool. The platform ships with a default Gemini path via Vertex ADC — your own keys take precedence.',
  feed: 'Structured real-time feeds. Add credentials where required; public feeds (GDELT, ReliefWeb, HDX, UNHCR, UCDP, World Bank, SIPRI, Crisis Group, UN News) are always on.',
};

const TIER_STYLES: Record<string, string> = {
  free: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  freemium: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  premium: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30',
};

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/api-keys', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped = useMemo(() => {
    if (!data) return null;
    const out: Record<ProviderCategory, ProviderSpec[]> = { ai: [], feed: [] };
    for (const spec of Object.values(data.providers)) out[spec.category].push(spec);
    return out;
  }, [data]);

  const coverage = useMemo(() => {
    if (!data) return null;
    const statuses = Object.values(data.statuses);
    const effective = statuses.filter((s) => s.effective).length;
    const total = statuses.length;
    return { effective, total, pct: Math.round((effective / total) * 100) };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading credentials…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 text-red-300">
        Failed to load credentials: {error}
        <button className="ml-3 underline" onClick={() => void refresh()}>Retry</button>
      </div>
    );
  }
  if (!data || !grouped) return null;

  return (
    <div className="mx-auto max-w-4xl p-8 text-slate-100">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <h1 className="text-2xl font-semibold">API Keys &amp; Data Sources</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          PRAXIS runs out of the box on the free tier using Google Search grounding. Add your own
          provider credentials below to unlock premium feeds and alternate AI models. Keys are
          encrypted at rest with AES-256-GCM and never leave our servers.
        </p>
        {coverage && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">Source coverage</span>
              <span className="font-semibold text-emerald-300">
                {coverage.effective} / {coverage.total} providers effective
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all"
                style={{ width: `${coverage.pct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const specs = grouped[cat];
        if (!specs.length) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {CATEGORY_LABELS[cat]}
            </h2>
            <p className="mb-4 text-xs text-slate-500">{CATEGORY_BLURBS[cat]}</p>
            <div className="grid gap-4">
              {specs.map((spec) => (
                <ProviderCard
                  key={spec.id}
                  spec={spec}
                  status={data.statuses[spec.id]}
                  onChanged={() => void refresh()}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ProviderCard({
  spec,
  status,
  onChanged,
}: {
  spec: ProviderSpec;
  status: ProviderKeyStatus;
  onChanged: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...status.nonSecretValues }));
  const [busy, setBusy] = useState<'idle' | 'saving' | 'validating' | 'deleting'>('idle');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const canValidate = !!spec.validator;

  async function save() {
    setBusy('saving');
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/api-keys/${spec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: values }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      setFeedback({ kind: 'ok', text: 'Saved. The key is encrypted and active.' });
      // Clear secret fields after save so we don't keep plaintext in the form state.
      const cleared = { ...values };
      for (const f of spec.fields) if (f.secret) cleared[f.name] = '';
      setValues(cleared);
      onChanged();
    } catch (e) {
      setFeedback({ kind: 'err', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setBusy('idle');
    }
  }

  async function validate() {
    setBusy('validating');
    setFeedback(null);
    try {
      // If a secret field has a typed value, validate the draft; otherwise validate what's stored.
      const hasDraft = spec.fields.some((f) => f.secret && values[f.name]);
      const body = hasDraft ? { payload: values } : {};
      const res = await fetch(`/api/settings/api-keys/${spec.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      setFeedback({ kind: json.ok ? 'ok' : 'err', text: json.ok ? 'Credentials verified.' : json.error ?? 'Validation failed' });
      if (!hasDraft) onChanged();
    } catch (e) {
      setFeedback({ kind: 'err', text: e instanceof Error ? e.message : 'Validation failed' });
    } finally {
      setBusy('idle');
    }
  }

  async function remove() {
    if (!confirm(`Remove your ${spec.label} credentials? The platform fallback (if configured) will take over.`)) return;
    setBusy('deleting');
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/api-keys/${spec.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setFeedback({ kind: 'ok', text: 'Removed.' });
      setValues({});
      onChanged();
    } catch (e) {
      setFeedback({ kind: 'err', text: e instanceof Error ? e.message : 'Delete failed' });
    } finally {
      setBusy('idle');
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">{spec.label}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${TIER_STYLES[spec.tier] ?? ''}`}>
              {spec.tier}
            </span>
            <StatusPill status={status} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{spec.tagline}</p>
          <p className="mt-1 text-[11px] text-slate-500">{spec.costHint}</p>
        </div>
        <div className="shrink-0 text-right">
          <a
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            href={spec.signupUrl}
            target="_blank"
            rel="noreferrer"
          >
            Get a key <ExternalLink className="h-3 w-3" />
          </a>
          <div>
            <a
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
              href={spec.docsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Docs <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {spec.unlocks.map((u) => (
          <li key={u} className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
            {u}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-2">
        {spec.fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-xs text-slate-400">
              {field.label}
              {field.required && <span className="ml-1 text-red-400">*</span>}
            </span>
            <input
              type={field.secret ? 'password' : 'text'}
              value={values[field.name] ?? ''}
              placeholder={
                field.secret && status.present && spec.fields.find((f) => f.name === field.name)?.secret
                  ? status.maskedPreview || field.placeholder
                  : field.placeholder
              }
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy !== 'idle'}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy === 'saving' ? 'Saving…' : 'Save'}
          </button>
          {canValidate && (
            <button
              type="button"
              onClick={() => void validate()}
              disabled={busy !== 'idle'}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
            >
              {busy === 'validating' ? 'Validating…' : 'Validate'}
            </button>
          )}
          {status.present && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy !== 'idle'}
              className="inline-flex items-center gap-1 rounded-md border border-red-900/50 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {busy === 'deleting' ? 'Removing…' : 'Remove'}
            </button>
          )}
        </div>
        {feedback && (
          <p
            className={`text-xs ${feedback.kind === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}
            role="status"
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ProviderKeyStatus }) {
  if (status.present && status.validatedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
        <Check className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (status.present) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
        Saved · not yet verified
      </span>
    );
  }
  if (status.platformFallbackAvailable) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
        Using platform default
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/30 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
      <X className="h-3 w-3" /> Not configured
    </span>
  );
}

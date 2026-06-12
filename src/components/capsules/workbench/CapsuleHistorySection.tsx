'use client';

import { memo, useEffect, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

type CapsuleHistoryVersion = {
  version?: number;
  updatedAt?: string;
  label?: string;
  appliedReviewCardTitle?: string | null;
};

type CapsuleHistoryDiffRow = {
  id: string;
  label: string;
  state: 'added' | 'removed' | 'changed';
  before: unknown;
  after: unknown;
};

type CapsuleHistoryDiffResponse = {
  fieldDiffs?: Partial<Record<'label' | 'summary' | 'claimLedger' | 'sourceRefs', CapsuleHistoryDiffRow[]>>;
};

export const CapsuleHistorySection = memo(function CapsuleHistorySection({ capsuleId, currentVersion }: { capsuleId: string; currentVersion: number }) {
  const [versions, setVersions] = useState<CapsuleHistoryVersion[]>([]);
  const [fromVersion, setFromVersion] = useState<number | null>(null);
  const [toVersion, setToVersion] = useState<number | null>(currentVersion);
  const [diff, setDiff] = useState<CapsuleHistoryDiffResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setStatus('Loading capsule history...');
      try {
        const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/history?limit=8`, { credentials: 'include' });
        if (!response.ok) throw new Error('history unavailable');
        const payload = await response.json().catch(() => ({})) as { versions?: CapsuleHistoryVersion[] };
        if (cancelled) return;
        const nextVersions = (payload.versions ?? [])
          .filter((version) => typeof version.version === 'number')
          .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
        setVersions(nextVersions);
        const nextTo = nextVersions[0]?.version ?? currentVersion;
        const nextFrom = nextVersions.find((version) => version.version !== nextTo)?.version ?? null;
        setToVersion(nextTo);
        setFromVersion(nextFrom);
        setStatus(nextVersions.length ? null : 'No saved versions yet.');
      } catch {
        if (!cancelled) setStatus('History is unavailable.');
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [capsuleId, currentVersion]);

  useEffect(() => {
    let cancelled = false;
    async function loadDiff() {
      if (!fromVersion || !toVersion || fromVersion === toVersion) {
        setDiff(null);
        return;
      }
      try {
        const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/diff?from=v${fromVersion}&to=v${toVersion}`, { credentials: 'include' });
        if (!response.ok) throw new Error('diff unavailable');
        const payload = await response.json().catch(() => ({})) as CapsuleHistoryDiffResponse;
        if (!cancelled) setDiff(payload);
      } catch {
        if (!cancelled) setStatus('Diff is unavailable.');
      }
    }
    void loadDiff();
    return () => {
      cancelled = true;
    };
  }, [capsuleId, fromVersion, toVersion]);

  const fieldDiffs = diff?.fieldDiffs ?? {};

  return (
    <WorkbenchSection title="History" icon={GitBranch}>
      <div data-testid="capsule-history-section" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <VersionSelect label="From" value={fromVersion} versions={versions} onChange={setFromVersion} />
          <VersionSelect label="To" value={toVersion} versions={versions} onChange={setToVersion} />
          {status ? <span className="text-[11px] font-semibold text-slate-500">{status}</span> : null}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {versions.slice(0, 6).map((version) => (
            <div key={version.version} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">v{version.version}</p>
                <span className="text-[11px] font-semibold text-slate-500">{formatHistoryDate(version.updatedAt)}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500">{version.appliedReviewCardTitle ?? 'No applied review-card title recorded.'}</p>
            </div>
          ))}
        </div>
        {fromVersion && toVersion && fromVersion !== toVersion ? (
          <div data-testid="capsule-version-diff" className="grid gap-2">
            <CapsuleDiffRows label="Label" rows={fieldDiffs.label ?? []} />
            <CapsuleDiffRows label="Summary" rows={fieldDiffs.summary ?? []} />
            <CapsuleDiffRows label="Claim ledger" rows={fieldDiffs.claimLedger ?? []} />
            <CapsuleDiffRows label="Source refs" rows={fieldDiffs.sourceRefs ?? []} />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">Select two versions to compare label, summary, claim ledger, and source refs.</p>
        )}
      </div>
    </WorkbenchSection>
  );
});

function VersionSelect({
  label,
  value,
  versions,
  onChange,
}: {
  label: string;
  value: number | null;
  versions: CapsuleHistoryVersion[];
  onChange: (version: number | null) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
      {label}
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700"
      >
        <option value="">Select</option>
        {versions.map((version) => (
          <option key={version.version} value={version.version}>v{version.version}</option>
        ))}
      </select>
    </label>
  );
}

function CapsuleDiffRows({ label, rows }: { label: string; rows: CapsuleHistoryDiffRow[] }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{rows.length} change{rows.length === 1 ? '' : 's'}</span>
      </div>
      {rows.length ? (
        <div className="grid gap-1.5">
          {rows.map((row) => (
            <div key={`${label}-${row.id}`} className="rounded-md border border-slate-200 bg-white p-2 text-xs leading-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{row.label}</p>
                <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-semibold', diffStateClass(row.state))}>{row.state}</span>
              </div>
              {row.state !== 'added' ? <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-800">- {formatDiffValue(row.before)}</p> : null}
              {row.state !== 'removed' ? <p className="mt-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">+ {formatDiffValue(row.after)}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No changes.</p>
      )}
    </div>
  );
}

function diffStateClass(state: CapsuleHistoryDiffRow['state']): string {
  if (state === 'added') return 'bg-emerald-50 text-emerald-800';
  if (state === 'removed') return 'bg-red-50 text-red-800';
  return 'bg-amber-50 text-amber-800';
}

function formatDiffValue(value: unknown): string {
  if (typeof value === 'string') return value || 'empty';
  if (value === null || typeof value === 'undefined') return 'empty';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatHistoryDate(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.slice(0, 10) : 'date unknown';
}

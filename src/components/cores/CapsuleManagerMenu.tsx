'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Power, Archive, Trash2, GitFork, Download, Star, Globe2 } from 'lucide-react';
import { ShareCapsuleButton } from '@/components/cores/ShareCapsuleButton';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

interface CapsuleManagerMenuProps {
  capsule: PraxisCapsule | null;
  onChanged?: (capsule: PraxisCapsule | null) => void;
}

export function CapsuleManagerMenu({ capsule, onChanged }: CapsuleManagerMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!capsule) return null;
  const currentCapsule = capsule;
  const capsuleId = capsule.capsuleId;
  const capsuleLabel = capsule.label;

  async function call(
    body: Record<string, unknown>,
    options: { method?: 'POST' | 'PATCH' | 'DELETE'; suffix?: string; expectNoCapsule?: boolean } = {},
  ) {
    setBusy(true);
    setError(null);
    try {
      const url = `/api/context/capsules/${encodeURIComponent(capsuleId)}${options.suffix ?? ''}`;
      const res = await fetch(url, {
        method: options.method ?? 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: options.method === 'DELETE' ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Action failed: ${res.status}`);
      const parsed = (await res.json().catch(() => ({}))) as { capsule?: PraxisCapsule };
      onChanged?.(options.expectNoCapsule ? null : parsed.capsule ?? capsule);
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId } }));
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    const label = window.prompt('Rename capsule', capsuleLabel);
    if (!label) return;
    await call({ label }, { method: 'PATCH' });
  }

  async function handleActivate() {
    await call({ action: 'activate' });
  }

  async function handleFork() {
    await call({ action: 'fork' });
  }

  function handleDownload() {
    window.location.href = `/api/context/capsules/${encodeURIComponent(capsuleId)}?format=core`;
  }

  async function handleFavorite() {
    await call({ action: 'favorite', favorite: !currentCapsule.community.favorite });
  }

  async function handlePublishToggle() {
    const nextVisibility = currentCapsule.access.visibility === 'public' ? 'private' : 'public';
    await call({
      action: 'set-visibility',
      visibility: nextVisibility,
      allowClone: true,
      allowDownload: true,
      allowCommunityRating: nextVisibility === 'public',
    });
  }

  async function handleRate() {
    const value = window.prompt('Rate this capsule from 1 to 5', String(currentCapsule.community.userRating ?? 5));
    if (!value) return;
    const rating = Number(value);
    if (!Number.isFinite(rating)) return;
    await call({ action: 'rate', rating: Math.max(1, Math.min(5, Math.round(rating))) });
  }

  async function handleArchive() {
    if (!window.confirm(`Archive "${capsuleLabel}"? You can restore later.`)) return;
    await call({}, { method: 'DELETE' });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${capsuleLabel}" from the active capsule list? Versions stay in the audit trail.`)) return;
    await call({}, { method: 'DELETE', suffix: '?mode=delete', expectNoCapsule: true });
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      <ShareCapsuleButton capsuleId={capsuleId} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-md border border-slate-200 bg-white text-xs shadow-lg">
          <MenuItem icon={Pencil} label="Rename" onClick={handleRename} disabled={busy} />
          <MenuItem icon={Power} label="Activate here" onClick={handleActivate} disabled={busy} />
          <MenuItem icon={GitFork} label="Clone / fork" onClick={handleFork} disabled={busy} />
          <MenuItem icon={Download} label="Download .core" onClick={handleDownload} disabled={busy || !currentCapsule.access.allowDownload} />
          <MenuItem icon={Star} label={currentCapsule.community.favorite ? 'Unfavorite' : 'Favorite'} onClick={handleFavorite} disabled={busy} />
          <MenuItem icon={Star} label="Rate" onClick={handleRate} disabled={busy} />
          <MenuItem icon={Globe2} label={currentCapsule.access.visibility === 'public' ? 'Make private' : 'Publish'} onClick={handlePublishToggle} disabled={busy} />
          <MenuItem icon={Archive} label="Archive" onClick={handleArchive} disabled={busy} />
          <MenuItem icon={Trash2} label="Delete" onClick={handleDelete} disabled={busy} tone="danger" />
          {error ? <p className="border-t border-rose-200 bg-rose-50 px-3 py-2 text-rose-900">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'danger';
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={
        'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50 ' +
        (tone === 'danger' ? 'text-rose-700 hover:bg-rose-50' : 'text-navy-950')
      }
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

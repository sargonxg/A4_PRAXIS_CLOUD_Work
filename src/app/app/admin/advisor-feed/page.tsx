'use client';

import { useEffect, useState } from 'react';

interface AdvisorFeedItem {
  id: string;
  title: string;
  content: string;
  type: string;
  sourceUrl?: string | null;
  tags?: string[];
}

const TYPES = ['policy', 'methodology', 'source', 'playbook', 'warning'];

export default function AdminAdvisorFeedPage() {
  const [items, setItems] = useState<AdvisorFeedItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('methodology');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/advisor-feed', { cache: 'no-store' });
    if (!res.ok) {
      setMessage(`Load failed: HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err instanceof Error ? err.message : String(err)));
  }, []);

  async function submit() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/advisor-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          type,
          sourceUrl,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? `Save failed: HTTP ${res.status}`);
        return;
      }
      setTitle('');
      setContent('');
      setSourceUrl('');
      setTags('');
      setMessage(`Saved ${data.id}`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-diplomatic-blue">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy-900">Advisor Feed</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-600">
          Add curated methodology notes, source guidance, playbooks, and policy warnings for the digital advisor layer.
          Items are stored server-side, audited, and ready for retrieval integration in the advisor context pipeline.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3 rounded-lg border border-navy-200 bg-white p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-navy-200 px-3 py-2 text-sm">
              {TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL"
              className="rounded-md border border-navy-200 px-3 py-2 text-sm md:col-span-2"
            />
          </div>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, comma separated"
            className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Advisor knowledge content"
            className="min-h-[260px] w-full rounded-md border border-navy-200 px-3 py-2 text-sm leading-relaxed"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white disabled:bg-navy-300"
            >
              {saving ? 'Saving...' : 'Add feed item'}
            </button>
            {message ? <span className="text-sm text-navy-600">{message}</span> : null}
          </div>
        </div>

        <aside className="rounded-lg border border-navy-200 bg-navy-50 p-4">
          <h2 className="text-sm font-semibold text-navy-900">Retrieval contract</h2>
          <p className="mt-2 text-xs leading-relaxed text-navy-600">
            This admin feed is the control point for advisor-level guidance. Next integration step:
            include active feed items in `buildCalibratedContext` or advisor-specific context blocks with source attribution.
          </p>
        </aside>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-500">Recent feed items</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-navy-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-navy-900">{item.title}</h3>
                  <p className="mt-1 text-xs text-navy-500">{item.type} · {(item.tags ?? []).join(', ') || 'no tags'}</p>
                </div>
                <code className="text-[10px] text-navy-400">{item.id}</code>
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-navy-700">{item.content}</p>
            </article>
          ))}
          {items.length === 0 ? <p className="text-sm text-navy-500">No advisor feed items yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

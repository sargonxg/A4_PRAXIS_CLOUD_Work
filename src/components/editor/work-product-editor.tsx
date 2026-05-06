'use client';

import { useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { FileJson, GitBranch, ShieldCheck } from 'lucide-react';
import { attachCypherPath, createEmptyProvenanceClaim } from '@/lib/draft/provenance-store';
import { buildJsonLdProvenanceManifest, type ProvenanceClaim } from '@/lib/exports/json-ld-prov';

export function WorkProductEditor({ workProductId = 'draft-local' }: { workProductId?: string }) {
  const [claims, setClaims] = useState<ProvenanceClaim[]>([
    createEmptyProvenanceClaim('Start drafting a sourced policy paragraph.'),
  ]);
  const [activeId, setActiveId] = useState(claims[0]?.id);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Draft a paragraph. Provenance chips update in the rail.' }),
    ],
    content: '<p>Start drafting a sourced policy paragraph.</p>',
    editorProps: {
      attributes: {
        class: 'min-h-72 rounded-md border border-slate-200 bg-white p-4 text-sm leading-7 text-navy-800 outline-none focus:border-gold-500',
        'data-testid': 'editor',
      },
    },
    immediatelyRender: false,
  });

  const activeClaim = claims.find((claim) => claim.id === activeId) ?? claims[0];
  const manifest = useMemo(() => buildJsonLdProvenanceManifest(claims, workProductId), [claims, workProductId]);

  function anchorToGraph() {
    if (!activeClaim) return;
    setClaims((current) => current.map((claim) => (
      claim.id === activeClaim.id
        ? attachCypherPath(claim, 'MATCH (claim)-[:SUPPORTED_BY]->(source) RETURN claim, source LIMIT 5')
        : claim
    )));
  }

  function registerParagraph() {
    const text = editor?.getText().trim() || 'Untitled paragraph';
    const claim = createEmptyProvenanceClaim(text);
    setClaims((current) => [...current, claim]);
    setActiveId(claim.id);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-500">Draft</p>
            <h1 className="mt-1 text-2xl font-semibold text-navy-900">Work product</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="new-work-product"
              onClick={registerParagraph}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50"
            >
              New paragraph
            </button>
            <button
              type="button"
              data-testid="anchor-to-graph"
              onClick={anchorToGraph}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
            >
              <GitBranch className="h-3.5 w-3.5" /> Anchor to graph
            </button>
          </div>
        </div>
        <EditorContent editor={editor} />
      </section>

      <aside className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Provenance
        </p>
        {claims.map((claim) => (
          <button
            key={claim.id}
            type="button"
            onClick={() => setActiveId(claim.id)}
            className="block w-full rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-navy-900">Trust {claim.trustScore}</span>
              <span data-testid="trust-score-badge" className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {claim.confidence}
              </span>
            </div>
            {claim.cypherPath ? (
              <p data-testid="provenance-chip-cypher" className="mt-2 rounded bg-gold-50 px-2 py-1 font-mono text-[10px] text-gold-800">
                {claim.cypherPath}
              </p>
            ) : null}
          </button>
        ))}
        <div className="rounded-md bg-slate-950 p-3 text-[10px] text-slate-100">
          <p className="mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
            <FileJson className="h-3.5 w-3.5" /> JSON-LD manifest
          </p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap">{JSON.stringify(manifest, null, 2)}</pre>
        </div>
      </aside>
    </div>
  );
}

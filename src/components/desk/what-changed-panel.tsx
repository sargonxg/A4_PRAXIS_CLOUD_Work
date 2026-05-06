'use client';

import { useMemo } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { diffGraphSnapshots } from '@/lib/graph/diff-engine';

export function WhatChangedPanel() {
  const diff = useMemo(() => diffGraphSnapshots(
    {
      nodes: [{ id: 'actor-sdf', label: 'SDF', stance: 'conditional' }],
      edges: [{ id: 'e1', source: 'actor-sdf', target: 'damascus', type: 'talks' }],
      sources: [{ id: 'src-1', title: 'UN Geneva note', updatedAt: '2026-05-01T00:00:00Z' }],
    },
    {
      nodes: [
        { id: 'actor-sdf', label: 'SDF', stance: 'implementation-risk' },
        { id: 'actor-civil', label: 'Civil society bloc', stance: 'watching' },
      ],
      edges: [{ id: 'e1', source: 'actor-sdf', target: 'damascus', type: 'talks', updatedAt: '2026-05-06T00:00:00Z' }],
      sources: [{ id: 'src-1', title: 'UN Geneva note', updatedAt: '2026-05-06T00:00:00Z' }],
    },
  ), []);

  const items = [
    `${diff.addedNodes.length} new actor proposal staged`,
    `${diff.modifiedNodes.length + diff.modifiedEdges.length} graph updates since last read`,
    `${diff.sourceUpdates.length} source update needs review`,
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
        <Activity className="h-3.5 w-3.5" /> What changed
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-navy-700">
            <ArrowRight className="h-3.5 w-3.5 text-gold-600" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

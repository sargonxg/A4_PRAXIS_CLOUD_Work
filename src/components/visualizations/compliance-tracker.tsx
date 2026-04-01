'use client';

import React, { useState } from 'react';

type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant' | 'pending';

interface ComplianceItem {
  id: string;
  label: string;
  status: ComplianceStatus;
  category?: string;
  notes?: string;
}

interface ComplianceTrackerProps {
  items: ComplianceItem[];
  title?: string;
  groupByCategory?: boolean;
}

const STATUS_CONFIG: Record<ComplianceStatus, { color: string; label: string; bg: string }> = {
  compliant: { color: '#10B981', label: 'Compliant', bg: '#10B98120' },
  partial: { color: '#F59E0B', label: 'Partial', bg: '#F59E0B20' },
  'non-compliant': { color: '#EF4444', label: 'Non-Compliant', bg: '#EF444420' },
  pending: { color: '#64748B', label: 'Pending', bg: '#64748B20' },
};

function StatusDot({ status }: { status: ComplianceStatus }) {
  const { color } = STATUS_CONFIG[status];
  return (
    <div
      className="rounded-full shrink-0"
      style={{ width: 8, height: 8, background: color, boxShadow: `0 0 4px ${color}80` }}
    />
  );
}

function ItemRow({ item }: { item: ComplianceItem }) {
  const [open, setOpen] = useState(false);
  const { bg } = STATUS_CONFIG[item.status];

  return (
    <div
      className="rounded px-3 py-2 transition-colors"
      style={{ background: bg }}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={item.status} />
        <span className="text-slate-200 text-sm flex-1 truncate">{item.label}</span>
        <span
          className="text-xs shrink-0"
          style={{ color: STATUS_CONFIG[item.status].color }}
        >
          {STATUS_CONFIG[item.status].label}
        </span>
        {item.notes ? (
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 text-xs ml-1 transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle notes"
          >
            {open ? '▲' : '▼'}
          </button>
        ) : null}
      </div>
      {open && item.notes ? (
        <p className="text-slate-400 text-xs mt-1.5 ml-4 leading-relaxed">{item.notes}</p>
      ) : null}
    </div>
  );
}

function CategoryGroup({ category, items }: { category: string; items: ComplianceItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const compliantCount = items.filter((i) => i.status === 'compliant').length;

  return (
    <div className="mb-3">
      <button
        type="button"
        className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 transition-colors mb-1"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
          {category}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">
            {compliantCount}/{items.length}
          </span>
          <span className="text-slate-600 text-xs">{collapsed ? '▶' : '▼'}</span>
        </div>
      </button>
      {collapsed ? null : (
        <div className="flex flex-col gap-1 pl-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ComplianceTracker({ items, title, groupByCategory = false }: ComplianceTrackerProps) {
  const total = items.length;
  const compliant = items.filter((i) => i.status === 'compliant').length;
  const partial = items.filter((i) => i.status === 'partial').length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
  const partialPct = total > 0 ? Math.round((partial / total) * 100) : 0;

  const grouped: Map<string, ComplianceItem[]> = new Map();
  if (groupByCategory) {
    items.forEach((item) => {
      const cat = item.category ?? 'General';
      const g = grouped.get(cat) ?? [];
      g.push(item);
      grouped.set(cat, g);
    });
  }

  return (
    <div className="w-full">
      {title ? (
        <div className="text-slate-200 font-medium text-sm mb-3">{title}</div>
      ) : null}

      {/* Summary stats */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <span className="text-2xl font-bold" style={{ color: '#10B981' }}>{pct}%</span>
          <span className="text-slate-500 text-xs ml-1">compliant</span>
        </div>
        <div className="text-slate-500 text-xs">
          {compliant}/{total} items
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden mb-4" style={{ height: 6, background: '#1E293B' }}>
        <div className="flex h-full">
          <div
            className="transition-all duration-700"
            style={{ width: `${pct}%`, background: '#10B981' }}
          />
          <div
            className="transition-all duration-700"
            style={{ width: `${partialPct}%`, background: '#F59E0B' }}
          />
        </div>
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(Object.keys(STATUS_CONFIG) as ComplianceStatus[]).map((s) => {
          const count = items.filter((i) => i.status === s).length;
          if (count === 0) return null;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="rounded-full"
                style={{ width: 7, height: 7, background: STATUS_CONFIG[s].color }}
              />
              <span className="text-slate-400 text-xs">
                {STATUS_CONFIG[s].label} ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* Items */}
      {groupByCategory ? (
        <div>
          {Array.from(grouped.entries()).map(([cat, catItems]) => (
            <CategoryGroup key={cat} category={cat} items={catItems} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

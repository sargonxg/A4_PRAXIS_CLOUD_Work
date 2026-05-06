'use client';

import { useState } from 'react';
import { Play, Save, ShieldCheck } from 'lucide-react';
import { validateReadOnlyCypher } from '@/lib/graph/cypher';

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  validation: string;
}

export function CypherConsole() {
  const [cypher, setCypher] = useState('MATCH (n) RETURN n LIMIT 10');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function runQuery() {
    setError(null);
    setSaved(false);
    const validation = validateReadOnlyCypher(cypher);
    if (!validation.ok) {
      setError(validation.error ?? 'Invalid Cypher query.');
      return;
    }

    const res = await fetch('/api/graph/cypher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cypher, params: {}, lens: 'default' }),
    });
    const body = (await res.json().catch(() => ({}))) as QueryResult & { error?: string };
    if (!res.ok) {
      setError(body.error ?? `Query failed (${res.status})`);
      return;
    }
    setResult(body);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-navy-500">
            <ShieldCheck className="h-3.5 w-3.5" /> Read-only Cypher
          </p>
          <h2 className="mt-1 text-lg font-semibold text-navy-900">Graph console</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button
            type="button"
            onClick={runQuery}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800"
          >
            <Play className="h-3.5 w-3.5" /> Run
          </button>
        </div>
      </div>

      <textarea
        value={cypher}
        onChange={(event) => setCypher(event.target.value)}
        className="mt-3 min-h-32 w-full resize-y rounded-md border border-slate-200 bg-slate-950 p-3 font-mono text-sm text-slate-50 outline-none focus:border-gold-500"
        spellCheck={false}
        data-testid="cypher-console-input"
      />

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
      {saved ? <p className="mt-2 text-xs font-medium text-emerald-700">Saved query staged for this workspace.</p> : null}

      {result ? (
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy-500">{result.validation}</div>
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-navy-500">
              <tr>{result.columns.map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}</tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {result.columns.map((column) => (
                    <td key={column} className="px-3 py-2 font-mono text-navy-700">{JSON.stringify(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

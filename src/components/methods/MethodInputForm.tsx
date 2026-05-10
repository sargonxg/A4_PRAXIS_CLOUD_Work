'use client';

import { useState } from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import type { MethodDefinition } from '@/lib/methods/catalog';

interface MethodInputFormProps {
  method: MethodDefinition;
  onPreview: (payload: { contextId: string; prompt: string }) => void;
}

export function MethodInputForm({ method, onPreview }: MethodInputFormProps) {
  const [contextId, setContextId] = useState('');
  const [prompt, setPrompt] = useState('');

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onPreview({ contextId: contextId.trim(), prompt: prompt.trim() });
      }}
    >
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-navy-700" />
        <h2 className="text-sm font-semibold text-navy-900">Run setup</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">
        Capture the method inputs here. Execution uses owner-scoped context routes when a context is selected.
      </p>

      <label className="mt-4 block text-xs font-semibold text-navy-800" htmlFor="context-id">
        Context ID
      </label>
      <input
        id="context-id"
        value={contextId}
        onChange={(event) => setContextId(event.target.value)}
        placeholder="optional-case-id"
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
      />

      <label className="mt-4 block text-xs font-semibold text-navy-800" htmlFor="method-prompt">
        Method instruction
      </label>
      <textarea
        id="method-prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={5}
        placeholder={`What should ${method.name} focus on?`}
        className="mt-1 w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy-400"
      />

      <button
        type="submit"
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
      >
        <ShieldCheck className="h-4 w-4" />
        Check run readiness
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import type { CaseScaffoldProposal, ProposedActor, ProposedClaim } from '@/lib/onboarding/case-scaffold';
import type { UserRole } from '@/types/situation';

interface AiFirstCaseCreationProps {
  userRole: UserRole;
  onApply: (proposal: CaseScaffoldProposal) => void;
  onManual: () => void;
}

const EXAMPLE_OBJECTIVE = 'Track ceasefire compliance in Sudan over Q3 2026, with focus on Khartoum and West Darfur.';

export function AiFirstCaseCreation({ userRole, onApply, onManual }: AiFirstCaseCreationProps) {
  const [objective, setObjective] = useState(EXAMPLE_OBJECTIVE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<CaseScaffoldProposal | null>(null);
  const [progress, setProgress] = useState('Ready to scaffold');

  async function scaffold() {
    setLoading(true);
    setError('');
    setProgress('Reviewing objective...');
    try {
      const phases = ['Identifying ontology...', 'Suggesting actors...', 'Recommending sources...'];
      phases.forEach((phase, index) => window.setTimeout(() => setProgress(phase), 250 + index * 300));
      const response = await fetch('/api/cases/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective, userRole }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.proposal) {
        throw new Error(data?.error ?? 'Scaffold request failed.');
      }
      setProposal(data.proposal);
      setProgress('Review scaffold');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scaffold request failed.');
      setProgress('Ready to scaffold');
    } finally {
      setLoading(false);
    }
  }

  function updateProposal(next: Partial<CaseScaffoldProposal>) {
    setProposal((current) => current ? { ...current, ...next } : current);
  }

  function toggleActor(id: string) {
    if (!proposal) return;
    updateProposal({
      initialActors: proposal.initialActors.map((actor) => actor.id === id ? { ...actor, accepted: !actor.accepted } : actor),
    });
  }

  function toggleClaim(id: string) {
    if (!proposal) return;
    updateProposal({
      initialClaims: proposal.initialClaims.map((claim) => claim.id === id ? { ...claim, accepted: !claim.accepted } : claim),
    });
  }

  return (
    <section data-testid="ai-first-case-creation" className="space-y-5">
      <div>
        <button type="button" onClick={onManual} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-navy-950">
          <ArrowLeft className="h-3.5 w-3.5" />
          Create manually instead
        </button>
        <div className="flex items-start gap-3">
          <Wand2 className="mt-1 h-5 w-5 text-gold-600" />
          <div>
            <h2 className="text-lg font-semibold text-navy-950">Create with AI assistance</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Describe the case once. PRAXIS proposes a frame, actors, claims, ontology lenses, and source categories for review before anything is persisted.
            </p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-navy-800">Describe the case you want to work on</span>
        <textarea
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-navy-950 placeholder:text-slate-500 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
        />
      </label>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-4 py-3">
        <p className="text-xs font-semibold text-navy-800">{progress}</p>
        <button
          type="button"
          disabled={loading || objective.trim().length < 12}
          onClick={() => void scaffold()}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 shadow-sm shadow-gold-500/20 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate scaffold
        </button>
      </div>

      {proposal ? (
        <ScaffoldReview
          proposal={proposal}
          onUpdate={updateProposal}
          onToggleActor={toggleActor}
          onToggleClaim={toggleClaim}
          onApply={() => onApply(proposal)}
        />
      ) : null}
    </section>
  );
}

function ScaffoldReview({
  proposal,
  onUpdate,
  onToggleActor,
  onToggleClaim,
  onApply,
}: {
  proposal: CaseScaffoldProposal;
  onUpdate: (next: Partial<CaseScaffoldProposal>) => void;
  onToggleActor: (id: string) => void;
  onToggleClaim: (id: string) => void;
  onApply: () => void;
}) {
  const ontologyLabel = CASE_ONTOLOGIES.find((ontology) => ontology.id === proposal.primaryOntologyId)?.label ?? proposal.primaryOntologyId;
  const acceptedActors = proposal.initialActors.filter((actor) => actor.accepted).length;
  const acceptedClaims = proposal.initialClaims.filter((claim) => claim.accepted).length;

  return (
    <div data-testid="case-scaffold-review" className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-navy-950">Scaffold Review</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">{proposal.rationale}</p>
        </div>
        <span className="rounded-full bg-diplomatic-blue/10 px-2.5 py-1 text-xs font-semibold text-diplomatic-blue">{ontologyLabel}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <EditableField label="Suggested case name" value={proposal.suggestedCaseName} onChange={(value) => onUpdate({ suggestedCaseName: value })} />
        <EditableField label="Suggested region" value={proposal.suggestedRegion} onChange={(value) => onUpdate({ suggestedRegion: value })} />
        <label className="md:col-span-2">
          <span className="text-xs font-semibold text-navy-800">Suggested description</span>
          <textarea
            value={proposal.suggestedDescription}
            onChange={(event) => onUpdate({ suggestedDescription: event.target.value })}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
          />
        </label>
      </div>

      <ReviewList title={`Actors (${acceptedActors} accepted)`} items={proposal.initialActors} onToggle={onToggleActor} render={(actor) => (
        <>
          <span className="font-semibold text-navy-950">{actor.name}</span>
          <span className="ml-2 text-slate-700">{actor.actorType}</span>
          <span className="mt-1 block text-xs text-slate-700">{actor.rationale}</span>
        </>
      )} />

      <ReviewList title={`Claims (${acceptedClaims} accepted)`} items={proposal.initialClaims} onToggle={onToggleClaim} render={(claim) => (
        <>
          <span className="font-semibold text-navy-950">{claim.actorName}</span>
          <span className="ml-2 text-slate-700">{claim.claimType}</span>
          <span className="mt-1 block text-xs text-slate-700">{claim.text}</span>
        </>
      )} />

      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-xs font-semibold text-navy-950">Recommended sources</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {proposal.suggestedSourceIds.map((sourceId) => (
            <span key={sourceId} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-800">{sourceId}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
        <p className="text-xs font-medium leading-5 text-emerald-800">Accepted scaffold items become user-reviewed creation inputs; rejected candidates stay out of the case.</p>
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Check className="h-4 w-4" />
          Use this scaffold
        </button>
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-semibold text-navy-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-navy-950 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/20"
      />
    </label>
  );
}

function ReviewList<T extends ProposedActor | ProposedClaim>({
  title,
  items,
  onToggle,
  render,
}: {
  title: string;
  items: T[];
  onToggle: (id: string) => void;
  render: (item: T) => ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-navy-950">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
            <input
              type="checkbox"
              checked={item.accepted}
              onChange={() => onToggle(item.id)}
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-diplomatic-blue"
            />
            <span className="flex-1 text-sm">
              {item.accepted ? null : <X className="mr-1 inline h-3.5 w-3.5 text-red-600" />}
              {render(item)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

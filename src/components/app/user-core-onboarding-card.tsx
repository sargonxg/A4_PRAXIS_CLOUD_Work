'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserRound, X } from 'lucide-react';
import { getMandateChips } from '@/lib/constants/onboarding-chips';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import type { AnalystRole } from '@/types/analyst-profile';
import { cn } from '@/lib/utils/cn';

const DISMISSED_KEY = 'praxis-user-core-onboarding-dismissed:v1';

const ROLE_OPTIONS: Array<{ id: AnalystRole; label: string }> = [
  { id: 'diplomat', label: 'Diplomat' },
  { id: 'un_official', label: 'UN' },
  { id: 'mediator', label: 'Mediator' },
  { id: 'think_tank', label: 'Think tank' },
  { id: 'ngo', label: 'NGO' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'other', label: 'Other' },
];

const OUTPUT_OPTIONS = ['Decision memo', 'Briefing note', 'Handover', 'Source review'] as const;

type CapsuleCreateResponse = {
  capsule?: {
    capsuleId: string;
    label?: string;
    version?: number;
  };
  error?: string;
};

export function UserCoreOnboardingCard({
  saveStack,
  stack,
  visible,
}: {
  saveStack: (patch: Partial<ActiveContextStackState>) => Promise<ActiveContextStackState>;
  stack: ActiveContextStackState;
  visible: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [role, setRole] = useState<AnalystRole>('diplomat');
  const [workOn, setWorkOn] = useState('');
  const [output, setOutput] = useState<(typeof OUTPUT_OPTIONS)[number]>('Decision memo');
  const [status, setStatus] = useState('Answer three questions to attach a primary User Core.');
  const [submitting, setSubmitting] = useState(false);
  const mandateChips = useMemo(() => getMandateChips(role).slice(0, 4), [role]);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === 'true');
    setReady(true);
  }, []);

  if (!ready || dismissed || !visible) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  async function buildUserCore() {
    const cleanWork = workOn.trim() || mandateChips[0] || 'I produce briefings for decision-makers.';
    const roleLabel = ROLE_OPTIONS.find((item) => item.id === role)?.label ?? 'Analyst';
    const outputId = `output:${slug(output)}`;
    const userCoreId = `user:${role}`;
    setSubmitting(true);
    setStatus('Creating User Core capsule...');
    try {
      const response = await fetch('/api/context/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: `${roleLabel} User Core`,
          scope: 'user',
          coreRefs: {
            userCoreId,
            outputCoreIds: [outputId],
            toolCoreIds: ['tool:sourceability-reviewer'],
            objectiveCoreIds: [`objective:${slug(cleanWork)}`],
          },
          retrievalPolicy: {
            layers: ['sources', 'documents', 'tool-output'],
            limit: 8,
            checkFreshness: true,
            freshnessWindowDays: 180,
          },
          community: {
            tags: ['user-core', role, slug(output), slug(cleanWork)],
          },
        }),
      });
      const payload = await response.json().catch(() => ({})) as CapsuleCreateResponse;
      if (!response.ok || !payload.capsule) {
        throw new Error(payload.error ?? `Capsule creation failed with ${response.status}`);
      }

      const capsule = payload.capsule;
      setStatus('Attaching User Core as primary context...');
      await saveStack({
        stackId: capsule.capsuleId,
        capsuleId: capsule.capsuleId,
        capsuleRefs: [{
          capsuleId: capsule.capsuleId,
          label: capsule.label ?? `${roleLabel} User Core`,
          role: 'primary',
          primary: true,
          order: 0,
          version: capsule.version ?? 1,
        }],
        userModelId: userCoreId,
        outputGoal: output,
        contextBlocks: {
          ...stack.contextBlocks,
          userCore: [{
            id: userCoreId,
            capsuleId: capsule.capsuleId,
            label: `${roleLabel} posture`,
            role: 'user',
            primary: true,
            order: 0,
          }],
          thinkingDevices: [{
            id: 'tool:sourceability-reviewer',
            capsuleId: capsule.capsuleId,
            label: 'Sourceability reviewer',
            role: 'tool',
            primary: true,
            order: 0,
          }, ...stack.contextBlocks.thinkingDevices],
          output: [{
            id: outputId,
            capsuleId: capsule.capsuleId,
            label: output,
            role: 'output',
            primary: true,
            order: 0,
          }],
        },
      });
      setStatus('User Core attached.');
      dismiss();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not build User Core.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details
      data-testid="user-core-onboarding-card"
      className="mt-2 rounded-[var(--radius-lg)] border border-emerald-200 bg-emerald-50/70 p-3 shadow-[var(--shadow-card)]"
    >
      <summary className="cursor-pointer text-sm font-semibold text-emerald-900">Personalize your answers <span className="font-normal text-slate-500">· optional</span></summary>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white text-emerald-700">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">Build your User Core</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">No capsules attached - direct ask. Add the analyst posture PRAXIS should use first.</p>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss User Core builder" className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-slate-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Role</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRole(option.id)}
                aria-pressed={role === option.id}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-xs font-semibold',
                  role === option.id ? 'border-emerald-500 bg-white text-emerald-800' : 'border-emerald-100 bg-white/70 text-slate-600 hover:bg-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">What you work on</span>
          <input
            value={workOn}
            onChange={(event) => setWorkOn(event.target.value)}
            className="min-h-10 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
            placeholder="A regional file, mediation track, sanctions package, or evidence brief"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {mandateChips.map((chip) => (
            <button key={chip} type="button" onClick={() => setWorkOn(chip)} className="rounded-md border border-emerald-100 bg-white px-2 py-1 text-left text-[11px] font-semibold leading-4 text-slate-600 hover:border-emerald-300">
              {chip}
            </button>
          ))}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Output you ship most</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {OUTPUT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setOutput(option)}
                aria-pressed={output === option}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 text-xs font-semibold',
                  output === option ? 'border-emerald-500 bg-white text-emerald-800' : 'border-emerald-100 bg-white/70 text-slate-600 hover:bg-white',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs leading-5 text-slate-600">{status}</p>
        <button
          type="button"
          onClick={() => void buildUserCore()}
          disabled={submitting}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-wait disabled:bg-emerald-300"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create User Core
        </button>
      </div>
    </details>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'user-core';
}

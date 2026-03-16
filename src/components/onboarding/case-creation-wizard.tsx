'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Check,
  Sparkles,
  Globe,
  Users,
  MessageSquare,
  Network,
  Calendar,
  Rocket,
  Loader2,
  AlertTriangle,
  Building2,
  Shield,
  Heart,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConflictStore } from '@/stores/conflict-store';
import type { CaseOntology } from '@/lib/constants/case-registry';
import { CASE_REGISTRY } from '@/lib/constants/case-registry';

// ============================================================================
// Types
// ============================================================================

interface WizardActor {
  id: string;
  name: string;
  type: string;
  description: string;
  importance: number;
}

interface WizardClaim {
  actorId: string;
  title: string;
  description: string;
  type: 'demand' | 'position';
}

interface WizardInterest {
  actorId: string;
  description: string;
  isExplicit: boolean;
}

interface WizardRelationship {
  sourceId: string;
  targetId: string;
  type: 'ally' | 'adversary' | 'neutral' | 'mediator';
  label: string;
}

interface WizardEvent {
  date: string;
  title: string;
  description: string;
  type: string;
  actorIds: string[];
}

interface WizardData {
  // Step 1
  name: string;
  description: string;
  region: string;
  conflictType: string;
  status: string;
  startYear: number;
  templateId: string | null;

  // Step 2
  actors: WizardActor[];

  // Step 3
  claims: WizardClaim[];
  interests: WizardInterest[];

  // Step 4
  relationships: WizardRelationship[];

  // Step 5
  events: WizardEvent[];
}

interface CaseCreationWizardProps {
  onComplete: (caseId: string) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const CONFLICT_TYPES = [
  { value: 'intrastate', label: 'Intrastate Armed Conflict', icon: Shield },
  { value: 'interstate', label: 'Interstate Conflict', icon: Globe },
  { value: 'organizational', label: 'Organizational / Workplace', icon: Briefcase },
  { value: 'community', label: 'Community / Local Governance', icon: Users },
  { value: 'peace_process', label: 'Peace Process Implementation', icon: Heart },
  { value: 'other', label: 'Other', icon: AlertTriangle },
];

const ACTOR_TYPES = [
  { value: 'state', label: 'State / Government' },
  { value: 'armed_group', label: 'Armed Group / Militia' },
  { value: 'international_org', label: 'International Organization' },
  { value: 'civil_society', label: 'Civil Society / NGO' },
  { value: 'private_sector', label: 'Private Sector' },
  { value: 'individual', label: 'Individual' },
];

const RELATIONSHIP_TYPES = [
  { value: 'ally', label: 'Ally / Partner', color: 'text-emerald-400' },
  { value: 'adversary', label: 'Adversary / Opponent', color: 'text-red-400' },
  { value: 'neutral', label: 'Neutral / Complex', color: 'text-slate-400' },
  { value: 'mediator', label: 'Mediator / Facilitator', color: 'text-amber-400' },
];

const SIMILAR_CASE_TEMPLATES = Object.entries(CASE_REGISTRY).map(([id, c]) => ({
  id,
  name: c.meta.name,
  region: c.meta.region,
  archetype: c.archetype,
  description: c.meta.description,
}));

const EVENT_TYPES = ['political', 'military', 'diplomatic', 'humanitarian', 'economic', 'legal'];

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Globe },
  { id: 2, label: 'Actors', icon: Users },
  { id: 3, label: 'Issues & Claims', icon: MessageSquare },
  { id: 4, label: 'Relationships', icon: Network },
  { id: 5, label: 'Timeline', icon: Calendar },
  { id: 6, label: 'Review & Launch', icon: Rocket },
];

// ============================================================================
// Step Components
// ============================================================================

function Step1BasicInfo({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-slate-300 mb-1 block">Conflict / Case Name *</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Riverside Valley Water Rights Dispute"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
        />
      </div>

      <div>
        <label className="text-sm text-slate-300 mb-1 block">Brief Description *</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe the conflict in 2-3 sentences: who is involved, what the core dispute is, and the current status."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-slate-300 mb-1 block">Region / Location</label>
          <input
            type="text"
            value={data.region}
            onChange={(e) => onChange({ region: e.target.value })}
            placeholder="e.g., East Africa, Pacific Northwest"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300 mb-1 block">Start Year</label>
          <input
            type="number"
            value={data.startYear}
            onChange={(e) => onChange({ startYear: parseInt(e.target.value) || 2024 })}
            min={1900}
            max={2026}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-300 mb-2 block">Conflict Type *</label>
        <div className="grid grid-cols-2 gap-2">
          {CONFLICT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ conflictType: value })}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                data.conflictType === value
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                  : 'bg-white/3 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-slate-300 mb-2 block">Start from a similar case template?</label>
        <div className="space-y-2">
          <button
            onClick={() => onChange({ templateId: null })}
            className={`w-full text-left p-2.5 rounded-lg border transition-all text-sm ${
              data.templateId === null
                ? 'bg-gold-500/10 border-gold-500/30 text-gold-300'
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Start from scratch
          </button>
          {SIMILAR_CASE_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onChange({ templateId: t.id })}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                data.templateId === t.id
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-300'
                  : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.name}</span>
                <Badge className="text-xs bg-white/5 text-slate-500 capitalize">{t.archetype}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t.region}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Actors({
  data,
  onChange,
  onAIAssist,
  isAILoading,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
  onAIAssist: () => void;
  isAILoading: boolean;
}) {
  const [newActor, setNewActor] = useState<Partial<WizardActor>>({
    type: 'state',
    importance: 7,
  });

  const addActor = () => {
    if (!newActor.name) return;
    const actor: WizardActor = {
      id: `actor-${Date.now()}`,
      name: newActor.name || '',
      type: newActor.type || 'state',
      description: newActor.description || '',
      importance: newActor.importance || 7,
    };
    onChange({ actors: [...data.actors, actor] });
    setNewActor({ type: 'state', importance: 7 });
  };

  const removeActor = (id: string) => {
    onChange({ actors: data.actors.filter((a) => a.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Add the key parties involved in this conflict. You need at least 2 actors to proceed.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onAIAssist}
          disabled={isAILoading || !data.description}
          className="shrink-0 border-white/10 text-slate-300 hover:bg-white/5 text-xs"
        >
          {isAILoading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 mr-1 text-gold-400" />
          )}
          AI Suggest
        </Button>
      </div>

      {/* Existing actors */}
      {data.actors.length > 0 && (
        <div className="space-y-2">
          {data.actors.map((actor) => (
            <div
              key={actor.id}
              className="flex items-center gap-2 p-2.5 bg-white/3 rounded-lg border border-white/10"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{actor.name}</span>
                  <Badge className="text-xs bg-white/5 text-slate-500 capitalize">
                    {actor.type.replace('_', ' ')}
                  </Badge>
                </div>
                {actor.description && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{actor.description}</p>
                )}
              </div>
              <span className="text-xs text-slate-500 shrink-0">Priority: {actor.importance}</span>
              <button
                onClick={() => removeActor(actor.id)}
                className="text-slate-500 hover:text-red-400 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add actor form */}
      <div className="bg-white/3 rounded-lg border border-white/10 border-dashed p-3 space-y-3">
        <p className="text-xs text-slate-500">Add an actor</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newActor.name || ''}
            onChange={(e) => setNewActor((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Actor name *"
            className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
          />
          <select
            value={newActor.type || 'state'}
            onChange={(e) => setNewActor((prev) => ({ ...prev, type: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          >
            {ACTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900">
                {t.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 shrink-0">Priority:</label>
            <input
              type="range"
              min={1}
              max={10}
              value={newActor.importance || 7}
              onChange={(e) => setNewActor((prev) => ({ ...prev, importance: parseInt(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-xs text-white w-4">{newActor.importance || 7}</span>
          </div>
        </div>
        <input
          type="text"
          value={newActor.description || ''}
          onChange={(e) => setNewActor((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
        />
        <Button
          size="sm"
          onClick={addActor}
          disabled={!newActor.name}
          className="bg-gold-500 hover:bg-gold-600 text-navy-900 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Actor
        </Button>
      </div>

      {data.actors.length < 2 && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Add at least 2 actors to proceed
        </p>
      )}
    </div>
  );
}

function Step3Claims({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}) {
  const [newClaim, setNewClaim] = useState<Partial<WizardClaim>>({ type: 'demand' });

  const addClaim = () => {
    if (!newClaim.actorId || !newClaim.title) return;
    onChange({
      claims: [...data.claims, newClaim as WizardClaim],
    });
    setNewClaim({ type: 'demand' });
  };

  const addInterest = (actorId: string, description: string, isExplicit: boolean) => {
    if (!description) return;
    onChange({
      interests: [...data.interests, { actorId, description, isExplicit }],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        For each actor, what do they want (claims) and what drives them (interests)?
      </p>

      {/* Actor-by-actor claims */}
      {data.actors.map((actor) => (
        <div key={actor.id} className="bg-white/3 rounded-lg border border-white/10 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gold-500" />
            <span className="text-sm text-white font-medium">{actor.name}</span>
          </div>

          {/* Existing claims for this actor */}
          {data.claims
            .filter((c) => c.actorId === actor.id)
            .map((claim, i) => (
              <div key={i} className="text-xs text-slate-400 pl-4">
                <span className="text-slate-300">{claim.title}</span>
                {' — '}
                <span className="capitalize text-slate-500">{claim.type}</span>
              </div>
            ))}

          {/* Existing interests for this actor */}
          {data.interests
            .filter((int) => int.actorId === actor.id)
            .map((interest, i) => (
              <div key={i} className="text-xs text-slate-400 pl-4 italic">
                {interest.isExplicit ? '(Stated)' : '(Unstated)'} {interest.description}
              </div>
            ))}
        </div>
      ))}

      {/* Add claim form */}
      <div className="bg-white/3 rounded-lg border border-white/10 border-dashed p-3 space-y-2">
        <p className="text-xs text-slate-500">Add a claim or interest</p>
        <select
          value={newClaim.actorId || ''}
          onChange={(e) => setNewClaim((prev) => ({ ...prev, actorId: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
        >
          <option value="" className="bg-slate-900">Select actor</option>
          {data.actors.map((a) => (
            <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
          ))}
        </select>
        <input
          type="text"
          value={newClaim.title || ''}
          onChange={(e) => setNewClaim((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="What do they claim or demand? (e.g., 'Full territorial sovereignty')"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
        />
        <input
          type="text"
          value={newClaim.description || ''}
          onChange={(e) => setNewClaim((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
        />
        <div className="flex gap-2">
          <select
            value={newClaim.type || 'demand'}
            onChange={(e) => setNewClaim((prev) => ({ ...prev, type: e.target.value as 'demand' | 'position' }))}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          >
            <option value="demand" className="bg-slate-900">Demand (what they want)</option>
            <option value="position" className="bg-slate-900">Position (stated stance)</option>
          </select>
          <Button
            size="sm"
            onClick={addClaim}
            disabled={!newClaim.actorId || !newClaim.title}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function Step4Relationships({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}) {
  const actors = data.actors;

  const getRelationship = (sourceId: string, targetId: string) => {
    return data.relationships.find(
      (r) => r.sourceId === sourceId && r.targetId === targetId
    );
  };

  const setRelationship = (sourceId: string, targetId: string, type: WizardRelationship['type']) => {
    const source = actors.find((a) => a.id === sourceId);
    const target = actors.find((a) => a.id === targetId);
    if (!source || !target) return;

    const existing = data.relationships.filter(
      (r) => !(r.sourceId === sourceId && r.targetId === targetId)
    );
    onChange({
      relationships: [
        ...existing,
        {
          sourceId,
          targetId,
          type,
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} relationship`,
        },
      ],
    });
  };

  const relColors: Record<string, string> = {
    ally: 'bg-emerald-500/20 text-emerald-300',
    adversary: 'bg-red-500/20 text-red-300',
    neutral: 'bg-slate-500/20 text-slate-300',
    mediator: 'bg-amber-500/20 text-amber-300',
  };

  if (actors.length < 2) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Network className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Add actors first to map relationships</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Define how each pair of actors relates to each other.
      </p>

      <div className="space-y-2">
        {actors.map((source, si) =>
          actors.slice(si + 1).map((target) => {
            const rel = getRelationship(source.id, target.id);
            return (
              <div
                key={`${source.id}-${target.id}`}
                className="flex items-center gap-3 p-2.5 bg-white/3 rounded-lg border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="truncate">{source.name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">{target.name}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setRelationship(source.id, target.id, rt.value as WizardRelationship['type'])}
                      className={`text-xs px-2 py-0.5 rounded transition-all ${
                        rel?.type === rt.value
                          ? relColors[rt.value] || 'bg-gold-500/20 text-gold-300'
                          : 'bg-white/5 text-slate-500 hover:text-white'
                      }`}
                    >
                      {rt.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-slate-500">
        {data.relationships.length} of {(actors.length * (actors.length - 1)) / 2} relationships defined
      </p>
    </div>
  );
}

function Step5Timeline({
  data,
  onChange,
}: {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}) {
  const [newEvent, setNewEvent] = useState<Partial<WizardEvent>>({
    type: 'political',
    actorIds: [],
  });

  const addEvent = () => {
    if (!newEvent.date || !newEvent.title) return;
    onChange({ events: [...data.events, newEvent as WizardEvent] });
    setNewEvent({ type: 'political', actorIds: [] });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Add key events in the conflict timeline. Start with the most important ones.
      </p>

      {/* Existing events */}
      {data.events.length > 0 && (
        <div className="space-y-2">
          {[...data.events]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((evt, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 bg-white/3 rounded-lg border border-white/10"
              >
                <div className="text-xs text-slate-500 tabular-nums mt-0.5 shrink-0 w-20">{evt.date}</div>
                <div className="flex-1">
                  <p className="text-xs text-white">{evt.title}</p>
                  <p className="text-xs text-slate-500">{evt.type}</p>
                </div>
                <button
                  onClick={() => onChange({ events: data.events.filter((_, idx) => idx !== i) })}
                  className="text-slate-600 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Add event form */}
      <div className="bg-white/3 rounded-lg border border-white/10 border-dashed p-3 space-y-2">
        <p className="text-xs text-slate-500">Add a key event</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={newEvent.date || ''}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          />
          <select
            value={newEvent.type || 'political'}
            onChange={(e) => setNewEvent((prev) => ({ ...prev, type: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t} className="bg-slate-900 capitalize">{t}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={newEvent.title || ''}
          onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Event title *"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30"
        />
        <textarea
          value={newEvent.description || ''}
          onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-white/30 resize-none"
        />
        <Button
          size="sm"
          onClick={addEvent}
          disabled={!newEvent.date || !newEvent.title}
          className="bg-gold-500 hover:bg-gold-600 text-navy-900 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Event
        </Button>
      </div>
    </div>
  );
}

function Step6Review({
  data,
  onLaunch,
  isLaunching,
}: {
  data: WizardData;
  onLaunch: () => void;
  isLaunching: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Review your case before launching it into PRAXIS.</p>

      {/* Summary card */}
      <div className="bg-white/3 rounded-xl border border-white/10 p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold text-lg">{data.name || 'Untitled Case'}</h3>
          <p className="text-sm text-slate-400 mt-1">{data.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-400">{data.actors.length}</p>
            <p className="text-xs text-slate-500">Actors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-400">{data.events.length}</p>
            <p className="text-xs text-slate-500">Events</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold-400">{data.claims.length + data.interests.length}</p>
            <p className="text-xs text-slate-500">Claims/Interests</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
          <Badge className="bg-white/5 text-slate-400">{data.region}</Badge>
          <Badge className="bg-white/5 text-slate-400 capitalize">{data.conflictType?.replace('_', ' ')}</Badge>
          <Badge className="bg-white/5 text-slate-400">Started {data.startYear}</Badge>
        </div>
      </div>

      {/* Actor list */}
      {data.actors.length > 0 && (
        <div className="bg-white/3 rounded-lg border border-white/10 p-3">
          <p className="text-xs text-slate-500 mb-2">Actors</p>
          <div className="space-y-1">
            {data.actors.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
                <span className="text-white">{a.name}</span>
                <span className="text-slate-500 capitalize">{a.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={onLaunch}
        disabled={isLaunching || !data.name || data.actors.length < 2}
        className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-semibold"
      >
        {isLaunching ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating case...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            Launch Case in PRAXIS
          </>
        )}
      </Button>

      {(!data.name || data.actors.length < 2) && (
        <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {!data.name ? 'Case name required' : 'At least 2 actors required'}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main CaseCreationWizard Component
// ============================================================================

const INITIAL_DATA: WizardData = {
  name: '',
  description: '',
  region: '',
  conflictType: 'intrastate',
  status: 'active',
  startYear: new Date().getFullYear(),
  templateId: null,
  actors: [],
  claims: [],
  interests: [],
  relationships: [],
  events: [],
};

export function CaseCreationWizard({ onComplete, onCancel }: CaseCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const { addConflict, addCustomCase, setActiveConflict } = useConflictStore();

  const handleChange = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return Boolean(data.name && data.description);
      case 2:
        return data.actors.length >= 2;
      case 3:
        return true; // Claims optional
      case 4:
        return true; // Relationships optional
      case 5:
        return true; // Events optional
      default:
        return true;
    }
  };

  const handleAIAssistActors = async () => {
    if (!data.description) return;
    setIsAILoading(true);
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Conflict: ${data.name}\n\n${data.description}`,
          extractionTargets: ['actors'],
        }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.actors) {
          const newActors: WizardActor[] = result.actors.slice(0, 5).map((a: { name?: string; type?: string; description?: string; importance?: number }, i: number) => ({
            id: `ai-actor-${Date.now()}-${i}`,
            name: a.name || `Actor ${i + 1}`,
            type: a.type || 'state',
            description: a.description || '',
            importance: a.importance || 7,
          }));
          handleChange({
            actors: [
              ...data.actors,
              ...newActors.filter(
                (na) => !data.actors.some((a) => a.name === na.name)
              ),
            ],
          });
        }
      }
    } catch {
      // Silently fail — user can add actors manually
    } finally {
      setIsAILoading(false);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const caseId = `custom-${Date.now()}`;

      // Build the ontology
      const ontology: CaseOntology = {
        actors: data.actors.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          description: a.description,
          importance: a.importance / 10,
        })),
        claims: data.claims.map((c, i) => ({
          id: `claim-${i}`,
          actorId: c.actorId,
          claimType: 'legal',
          title: c.title,
          description: c.description || c.title,
          basis: '',
          type: c.type,
          status: 'active',
        })),
        interests: data.interests.map((int, i) => ({
          id: `int-${i}`,
          actorId: int.actorId,
          description: int.description,
          type: 'political',
          priority: 'important',
          isExplicit: int.isExplicit,
        })),
        constraints: [],
        leverage: [],
        commitments: [],
        events: data.events.map((e, i) => ({
          id: `evt-${i}`,
          date: e.date,
          title: e.title,
          description: e.description || e.title,
          type: e.type,
          impact: 'moderate',
          involvedActors: e.actorIds,
          escalatoryDirection: 'neutral',
        })),
        narratives: [],
        relationships: data.relationships.map((r) => ({
          source: r.sourceId,
          target: r.targetId,
          type: r.type,
          label: r.label,
        })),
        glaslStage: 3,
        escalationTrend: 'stable',
      };

      // Add to store
      addCustomCase(caseId, ontology);
      addConflict({
        id: caseId,
        name: data.name,
        region: data.region || 'Unknown',
        status: data.status as 'active' | 'frozen' | 'resolved' | 'emerging' | 'escalating',
        description: data.description,
        riskScore: 5.0,
        actorCount: data.actors.length,
        graphEntities: data.actors.length + data.events.length,
        events: data.events.slice(0, 5).map((e) => ({ title: e.title, date: e.date })),
      });
      setActiveConflict(caseId);

      onComplete(caseId);
    } catch {
      // Handle error
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-navy-950 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold">Create New Case</h2>
          <p className="text-xs text-slate-400 mt-0.5">Step {currentStep} of {STEPS.length}</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center px-6 py-3 border-b border-white/10 gap-1 overflow-x-auto">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isCompleted && setCurrentStep(step.id)}
                disabled={!isCompleted}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                    : isCompleted
                    ? 'text-slate-300 hover:text-white cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-gold-400" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px ${isCompleted ? 'bg-gold-500/40' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {currentStep === 1 && <Step1BasicInfo data={data} onChange={handleChange} />}
            {currentStep === 2 && (
              <Step2Actors
                data={data}
                onChange={handleChange}
                onAIAssist={handleAIAssistActors}
                isAILoading={isAILoading}
              />
            )}
            {currentStep === 3 && <Step3Claims data={data} onChange={handleChange} />}
            {currentStep === 4 && <Step4Relationships data={data} onChange={handleChange} />}
            {currentStep === 5 && <Step5Timeline data={data} onChange={handleChange} />}
            {currentStep === 6 && (
              <Step6Review data={data} onLaunch={handleLaunch} isLaunching={isLaunching} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {currentStep < 6 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            disabled={!canProceed()}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900"
          >
            {currentStep === 5 ? 'Review' : 'Continue'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default CaseCreationWizard;

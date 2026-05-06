'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';

interface ModelPreferences {
  fast_analysis: string;
  deep_analysis: string;
  creative_drafting: string;
  research: string;
}

const DEFAULT_PREFS: ModelPreferences = {
  fast_analysis: 'gemini-2.5-flash',
  deep_analysis: 'gemini-2.5-pro',
  creative_drafting: 'gemini-2.5-pro',
  research: 'gemini-2.5-flash',
};

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (fast, economical)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (deep, comprehensive)' },
];

export default function ModelPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<ModelPreferences>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'users', user.id, 'settings', 'model_preferences')).then((snap) => {
      if (snap.exists()) setPrefs({ ...DEFAULT_PREFS, ...(snap.data() as Partial<ModelPreferences>) });
      setLoading(false);
    });
  }, [user?.id]);

  async function handleSave() {
    if (!user?.id) return;
    await setDoc(doc(db, 'users', user.id, 'settings', 'model_preferences'), prefs, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const categories: Array<{ key: keyof ModelPreferences; label: string; description: string }> = [
    { key: 'fast_analysis', label: 'Fast Analysis', description: 'Quick extractions, stakeholder maps, timeline views' },
    { key: 'deep_analysis', label: 'Deep Analysis', description: 'Briefs, dossiers, risk assessments, scenario analysis' },
    { key: 'creative_drafting', label: 'Creative Drafting', description: 'Talking points, policy memos, mediation design' },
    { key: 'research', label: 'Research', description: 'Deep research, media roundup, actor enrichment' },
  ];

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Model Preferences</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Choose which AI model PRAXIS uses for each type of operation.
        Production uses Vertex AI Gemini; local development can use a Google AI key.
      </p>

      <div className="space-y-5">
        {categories.map(({ key, label, description }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-foreground mb-0.5">{label}</label>
            <p className="text-xs text-muted-foreground mb-2">{description}</p>
            <select
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
              value={prefs[key]}
              onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.value }))}
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-6 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        {saved ? 'Saved!' : 'Save Preferences'}
      </button>
    </div>
  );
}

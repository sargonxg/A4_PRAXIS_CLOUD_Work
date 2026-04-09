'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';

interface ApiKeys {
  google_ai_key: string;
  anthropic_key: string;
  openai_key: string;
  firecrawl_key: string;
  tavily_key: string;
  parallel_key: string;
}

function maskKey(key: string): string {
  if (!key) return '';
  return key.slice(0, 4) + '****';
}

// Map from ApiKeys field name to validate-key provider name
const VALIDATABLE_KEYS: Partial<Record<keyof ApiKeys, 'tavily' | 'firecrawl' | 'anthropic' | 'openai'>> = {
  tavily_key: 'tavily',
  firecrawl_key: 'firecrawl',
  anthropic_key: 'anthropic',
  openai_key: 'openai',
};

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeys>({ google_ai_key: '', anthropic_key: '', openai_key: '', firecrawl_key: '', tavily_key: '', parallel_key: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyValidation, setKeyValidation] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  const [keyErrors, setKeyErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'users', user.id, 'settings', 'api_keys')).then((snap) => {
      if (snap.exists()) setKeys(snap.data() as ApiKeys);
      setLoading(false);
    });
  }, [user?.id]);

  async function handleSave() {
    if (!user?.id) return;
    // TODO: In production, store keys in Secret Manager instead of Firestore
    await setDoc(doc(db, 'users', user.id, 'settings', 'api_keys'), keys, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const validateApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) return;
    setKeyValidation((prev) => ({ ...prev, [provider]: 'validating' }));
    try {
      const res = await fetch('/api/settings/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      const data = await res.json() as { valid: boolean; error?: string };
      setKeyValidation((prev) => ({ ...prev, [provider]: data.valid ? 'valid' : 'invalid' }));
      if (!data.valid && data.error) {
        setKeyErrors((prev) => ({ ...prev, [provider]: data.error! }));
      } else {
        setKeyErrors((prev) => { const n = { ...prev }; delete n[provider]; return n; });
      }
    } catch {
      setKeyValidation((prev) => ({ ...prev, [provider]: 'invalid' }));
      setKeyErrors((prev) => ({ ...prev, [provider]: 'Network error during validation' }));
    }
  };

  const fields: Array<{ key: keyof ApiKeys; label: string; placeholder: string; docs: string; section?: string; description?: string }> = [
    { key: 'google_ai_key', label: 'Google AI API Key (Gemini)', placeholder: 'AIza...', docs: 'aistudio.google.com', section: 'AI Models' },
    { key: 'anthropic_key', label: 'Anthropic API Key (Claude)', placeholder: 'sk-ant-...', docs: 'console.anthropic.com' },
    { key: 'openai_key', label: 'OpenAI API Key', placeholder: 'sk-...', docs: 'platform.openai.com' },
    { key: 'tavily_key', label: 'Tavily API Key', placeholder: 'tvly-...', docs: 'app.tavily.com', section: 'Web Research (Premium)', description: 'AI-optimized search engine. 1,000 free credits/month. Enhances all tools with deeper web intelligence.' },
    { key: 'parallel_key', label: 'Parallel.ai API Key', placeholder: 'par-...', docs: 'platform.parallel.ai', description: 'AI-powered web research, entity discovery, and monitoring. Adds deep enrichment to actor profiles, dossiers, and media analysis.' },
    { key: 'firecrawl_key', label: 'Firecrawl API Key', placeholder: 'fc-...', docs: 'firecrawl.dev', description: 'Full-page web scraping with JS rendering. Extracts clean content from any URL.' },
  ];

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground mb-2">API Keys</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Your keys are used for AI operations and web research. If not provided, platform defaults are used.
        Google Search (via Gemini) is always available as the default research provider.
        Add Tavily or Parallel.ai keys to unlock premium web research across all tools.
      </p>

      <div className="space-y-5">
        {fields.map(({ key, label, placeholder, docs, section, description }) => (
          <div key={key}>
            {section && (
              <div className="mt-4 mb-3 pt-4 border-t border-border">
                <h2 className="text-sm font-semibold text-foreground">{section}</h2>
                {section === 'Web Research (Premium)' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    These providers run in parallel with Google Search for richer results.
                    All results are AI-processed and integrated into every tool.
                  </p>
                )}
              </div>
            )}
            <label className="block text-sm font-medium text-foreground mb-1">
              {label}
              <span className="ml-2 text-xs text-muted-foreground">({docs})</span>
            </label>
            {description && (
              <p className="text-xs text-muted-foreground mb-1.5">{description}</p>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="password"
                className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                placeholder={keys[key] ? maskKey(keys[key]) : placeholder}
                value={keys[key]}
                onChange={(e) => setKeys((prev) => ({ ...prev, [key]: e.target.value }))}
                onBlur={(e) => {
                  const provider = VALIDATABLE_KEYS[key];
                  if (provider) validateApiKey(provider, e.target.value);
                }}
              />
              {keys[key] && !VALIDATABLE_KEYS[key] && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>
              )}
              {VALIDATABLE_KEYS[key] && (() => {
                const provider = VALIDATABLE_KEYS[key]!;
                const status = keyValidation[provider];
                if (status === 'validating') return <span className="shrink-0 text-xs text-white/40 animate-pulse">Validating…</span>;
                if (status === 'valid') return <span className="shrink-0 text-xs text-emerald-400">✓ Valid</span>;
                if (status === 'invalid') return <span className="shrink-0 text-xs text-red-400">✗ {keyErrors[provider] || 'Invalid key'}</span>;
                if (keys[key]) return <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>;
                return null;
              })()}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-6 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        {saved ? 'Saved!' : 'Save API Keys'}
      </button>
    </div>
  );
}

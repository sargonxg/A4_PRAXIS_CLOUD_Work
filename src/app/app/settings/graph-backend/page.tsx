'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import { PraxisLink } from '@/components/shared/praxis-link';

type GraphProvider = 'spanner' | 'neo4j' | 'neo4j_self' | 'falkordb_cloud' | 'falkordb_self';

interface GraphBackendConfig {
  provider: GraphProvider;
  uri: string;
  host: string;
  port: string;
  user: string;
  password: string;
  // Spanner-specific
  project_id: string;
  instance_id: string;
  database_id: string;
}

const DEFAULT_CONFIG: GraphBackendConfig = {
  provider: 'neo4j',
  uri: '',
  host: 'localhost',
  port: '6379',
  user: 'neo4j',
  password: '',
  project_id: '',
  instance_id: 'praxis-graph',
  database_id: 'praxis-graph-db',
};

const PROVIDERS: Array<{ value: GraphProvider; label: string; description: string }> = [
  {
    value: 'spanner',
    label: 'Cloud Spanner Graph',
    description: 'Production multi-region — managed, ZeroETL with BigQuery, ISO GQL. Recommended for production deployments.',
  },
  { value: 'neo4j', label: 'Neo4j AuraDB (Cloud)', description: 'Managed Neo4j cloud database.' },
  { value: 'neo4j_self', label: 'Self-hosted Neo4j', description: 'Your own Neo4j instance.' },
  { value: 'falkordb_cloud', label: 'FalkorDB Cloud', description: 'Managed FalkorDB — Redis-compatible, sub-millisecond graph queries.' },
  { value: 'falkordb_self', label: 'Self-hosted FalkorDB (ephemeral)', description: 'Your own FalkorDB / Redis instance. Not recommended for production.' },
];

function isNeo4j(provider: GraphProvider) {
  return provider === 'neo4j' || provider === 'neo4j_self';
}

function isSpanner(provider: GraphProvider) {
  return provider === 'spanner';
}

export default function GraphBackendPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<GraphBackendConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getDoc(doc(db, 'users', user.id, 'settings', 'graph_backend')).then((snap) => {
      if (snap.exists()) setConfig({ ...DEFAULT_CONFIG, ...(snap.data() as Partial<GraphBackendConfig>) });
      setLoading(false);
    });
  }, [user?.id]);

  async function handleSave() {
    if (!user?.id) return;
    await setDoc(doc(db, 'users', user.id, 'settings', 'graph_backend'), config, { merge: true });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/backend/graph/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, message: data.message || (res.ok ? 'Connection successful' : 'Connection failed') });
    } catch {
      setTestResult({ ok: false, message: 'Could not reach backend service.' });
    } finally {
      setTesting(false);
    }
  }

  const set = (key: keyof GraphBackendConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const neo4j = isNeo4j(config.provider);
  const spanner = isSpanner(config.provider);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground mb-2">Graph Backend</h1>
      <p className="text-muted-foreground mb-3 text-sm">
        Choose where PRAXIS stores the conflict knowledge graph.
        Cloud Spanner Graph is recommended for production (managed, multi-region, ISO GQL, ZeroETL with BigQuery).
        Neo4j AuraDB is a solid managed alternative; FalkorDB offers Redis-compatible sub-millisecond performance.
      </p>
      <div className="mb-6 rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">PRAXIS works without this.</span>{' '}
          By default, the conflict graph for each situation is stored in Firestore subcollections under your user, with the same calibration, citations, and tool-output contract.
          Configure a dedicated graph backend only when you need cross-situation traversals, large-graph analytics, or organisation-wide deployment.
        </p>
        <p className="mt-2">
          Connection settings are saved to <code className="font-mono">users/{'{'}uid{'}'}/settings/graph_backend</code> and are readable only by you and the PRAXIS server. Treat any credentials you paste here as production secrets.
        </p>
      </div>

      <div className="mb-6 rounded-md border border-gold-500/30 bg-gold-500/10 p-3 text-xs leading-relaxed text-navy-700">
        <p>
          <span className="font-medium text-navy-900">Dialectica premium adapter:</span>{' '}
          PRAXIS is preparing a separate Dialectica backend contract for Datalog reasoning, named provenance graphs,
          contradiction detection, and scenario forks. It is intentionally not listed as a credential provider here
          until the adapter and feature flags are production-ready.
        </p>
        <PraxisLink href="/dialectica" className="mt-2 inline-flex text-xs font-semibold text-gold-800 underline underline-offset-2">
          View Dialectica backbone preview
        </PraxisLink>
      </div>

      {/* Provider selection */}
      <div className="space-y-2 mb-6">
        {PROVIDERS.map(({ value, label, description }) => (
          <label
            key={value}
            className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
              config.provider === value
                ? 'border-emerald-600 bg-emerald-600/5'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <input
              type="radio"
              name="provider"
              value={value}
              checked={config.provider === value}
              onChange={() => set('provider', value)}
              className="mt-0.5 accent-emerald-600"
            />
            <div>
              <div className="text-sm font-medium text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Connection fields */}
      <div className="space-y-4 border border-border rounded-md p-4 mb-6">
        <h2 className="text-sm font-medium text-foreground">Connection Settings</h2>

        {spanner ? (
          <>
            <p className="text-xs text-muted-foreground">
              Cloud Spanner Graph uses Workload Identity on Cloud Run — no password required.
              Run <code className="font-mono bg-muted px-1 rounded">infrastructure/setup-spanner.sh</code> once to provision the instance.
            </p>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">GCP Project ID</label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="praxisbytacitus"
                value={config.project_id}
                onChange={(e) => set('project_id', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Instance ID</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="praxis-graph"
                  value={config.instance_id}
                  onChange={(e) => set('instance_id', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Database ID</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="praxis-graph-db"
                  value={config.database_id}
                  onChange={(e) => set('database_id', e.target.value)}
                />
              </div>
            </div>
          </>
        ) : neo4j ? (
          <>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {config.provider === 'neo4j' ? 'AuraDB Connection URI' : 'Bolt URI'}
              </label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="neo4j+s://xxxx.databases.neo4j.io"
                value={config.uri}
                onChange={(e) => set('uri', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Username</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  placeholder="neo4j"
                  value={config.user}
                  onChange={(e) => set('user', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => set('password', e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Host</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="localhost"
                  value={config.host}
                  onChange={(e) => set('host', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Port</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono"
                  placeholder="6379"
                  value={config.port}
                  onChange={(e) => set('port', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Password (if required)</label>
              <input
                type="password"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                placeholder="Leave blank if none"
                value={config.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div
          className={`mb-4 px-4 py-3 rounded-md text-sm ${
            testResult.ok
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/30'
              : 'bg-red-600/10 text-red-400 border border-red-600/30'
          }`}
        >
          {testResult.message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing}
          className="px-5 py-2 border border-border hover:border-muted-foreground text-foreground rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

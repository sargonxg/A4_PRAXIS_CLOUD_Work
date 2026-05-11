'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Building2,
  Palette,
  Key,
  Shield,
  Mail,
  Briefcase,
  PlayCircle,
  RotateCcw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Server,
  Globe,
  GitBranch,
  Layers,
  ArrowRight,
  CreditCard,
  Sparkles,
  Activity,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

/* ---------------------------------------------------------------------------
 * Section wrapper — light theme
 * -------------------------------------------------------------------------*/

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="border-b border-[var(--color-app-border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100">
            <Icon className="h-4 w-4 text-diplomatic-blue" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
            <p className="text-xs text-navy-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Read-only field — light theme
 * -------------------------------------------------------------------------*/

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-navy-600">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <div className="rounded-md border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-800">
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Inline code block — light theme
 * -------------------------------------------------------------------------*/
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-[10px] text-diplomatic-blue">
      {children}
    </code>
  );
}

/* ---------------------------------------------------------------------------
 * ACO Primitives section (extracted for useState)
 * -------------------------------------------------------------------------*/

const ACO_PRIMITIVES = [
  { name: 'Actor', description: 'Parties to the conflict', color: 'bg-blue-500', toggleColor: 'peer-checked:bg-blue-500' },
  { name: 'Claim', description: 'Formal positions and demands', color: 'bg-purple-500', toggleColor: 'peer-checked:bg-purple-500' },
  { name: 'Interest', description: 'Underlying needs and motivations', color: 'bg-teal-500', toggleColor: 'peer-checked:bg-teal-500' },
  { name: 'Constraint', description: 'Limiting factors and boundaries', color: 'bg-red-500', toggleColor: 'peer-checked:bg-red-500' },
  { name: 'Leverage', description: 'Sources of influence and power', color: 'bg-amber-500', toggleColor: 'peer-checked:bg-amber-500' },
  { name: 'Commitment', description: 'Agreements and promises made', color: 'bg-green-500', toggleColor: 'peer-checked:bg-green-500' },
  { name: 'Event', description: 'Key occurrences and incidents', color: 'bg-orange-500', toggleColor: 'peer-checked:bg-orange-500' },
  { name: 'Narrative', description: 'Framing and storytelling patterns', color: 'bg-pink-500', toggleColor: 'peer-checked:bg-pink-500' },
];

function EcosystemACOSection() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ACO_PRIMITIVES.map((p) => [p.name, true]))
  );

  return (
    <SettingsSection
      icon={GitBranch}
      title="Conflict Grammar Configuration"
      description="Agentic Conflict Ontology (ACO) primitives for structured analysis"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACO_PRIMITIVES.map((prim) => (
          <div
            key={prim.name}
            className="rounded-lg border border-[var(--color-app-border)] bg-white p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn('h-3 w-3 rounded-full', prim.color)} />
              <p className="text-xs font-bold text-navy-900">{prim.name}</p>
            </div>
            <p className="text-[10px] text-navy-500 leading-snug mb-2">{prim.description}</p>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <div
                className="relative h-4 w-7 rounded-full transition-colors"
                style={{ backgroundColor: enabled[prim.name] ? undefined : '#cbd5e1' }}
              >
                <input
                  type="checkbox"
                  checked={enabled[prim.name]}
                  onChange={() => setEnabled((prev) => ({ ...prev, [prim.name]: !prev[prim.name] }))}
                  className="peer sr-only"
                />
                <div
                  className={cn(
                    'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all shadow-sm',
                    enabled[prim.name] ? 'left-3.5' : 'left-0.5'
                  )}
                />
                <div
                  className={cn(
                    'absolute inset-0 rounded-full transition-colors',
                    enabled[prim.name] ? prim.color + '/80' : 'bg-navy-200'
                  )}
                  style={{ zIndex: -1 }}
                />
              </div>
              <span className="text-[10px] text-navy-400">Analyze</span>
            </label>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-navy-500">
        The Agentic Conflict Ontology (ACO) v2.0 powers all TACITUS products. Disabling a primitive in demo mode hides it from analysis views.
      </p>
    </SettingsSection>
  );
}

/* ---------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------*/

/* ---------------------------------------------------------------------------
 * Payment & Upgrade Banner (reads ?payment=success or ?upgrade=analyst)
 * Wrapped in Suspense because useSearchParams requires it in App Router.
 * -------------------------------------------------------------------------*/

function PaymentBanner() {
  const searchParams = useSearchParams();
  const payment = searchParams.get('payment');
  const upgrade = searchParams.get('upgrade');
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Auto-trigger checkout when user arrives with ?upgrade=analyst
  useEffect(() => {
    if (upgrade && !isCheckingOut && user && !user.isDemo) {
      handleUpgrade(upgrade);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrade, user]);

  async function handleUpgrade(planId: string) {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(
          data.error || 'Subscription checkout is not available yet. Contact TACITUS to activate this plan.',
        );
        setIsCheckingOut(false);
      }
    } catch {
      setCheckoutError('Subscription checkout could not be reached. Contact TACITUS to activate this plan.');
      setIsCheckingOut(false);
    }
  }

  if (dismissed) return null;

  // Payment success toast
  if (payment === 'success') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">Payment Successful</p>
          <p className="text-xs text-emerald-600">Your plan has been upgraded and credits have been added to your account.</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-emerald-400 hover:text-emerald-600 text-xs">Dismiss</button>
      </div>
    );
  }

  // Payment cancelled
  if (payment === 'cancelled') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-gold-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gold-800">Payment Cancelled</p>
          <p className="text-xs text-gold-600">No charges were made. You can upgrade anytime from the pricing page.</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-gold-400 hover:text-gold-600 text-xs">Dismiss</button>
      </div>
    );
  }

  if (checkoutError) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-gold-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gold-800">Checkout Not Available</p>
          <p className="text-xs text-gold-700">{checkoutError}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-gold-500 hover:text-gold-700 text-xs">Dismiss</button>
      </div>
    );
  }

  // Upgrade in progress
  if (isCheckingOut) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-4">
        <CreditCard className="h-5 w-5 shrink-0 text-diplomatic-blue animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-800">Redirecting to checkout...</p>
          <p className="text-xs text-navy-500">You&apos;ll be taken to Polar to complete your upgrade.</p>
        </div>
      </div>
    );
  }

  return null;
}

function FullAccessCodeSection() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  });

  async function redeemCode() {
    const trimmed = code.trim();
    if (!trimmed) {
      setStatus({ type: 'error', message: 'Enter an access code.' });
      return;
    }

    setStatus({ type: 'loading' });
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Code could not be redeemed.' });
        return;
      }

      const expires = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'seven days';
      setStatus({ type: 'success', message: `Full access is active until ${expires}.` });
      window.setTimeout(() => window.location.reload(), 1200);
    } catch {
      setStatus({ type: 'error', message: 'Code could not be redeemed.' });
    }
  }

  return (
    <SettingsSection
      icon={Sparkles}
      title="Full Access Code"
      description="Redeem a TACITUS code for one week of enterprise capabilities"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <label htmlFor="full-access-code" className="text-xs font-medium text-navy-600">
            Access code
          </label>
          <input
            id="full-access-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="PRAXIS-WEEK-PASS"
            disabled={status.type === 'loading' || user?.isDemo}
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-diplomatic-blue focus:ring-2 focus:ring-diplomatic-blue/10 disabled:cursor-not-allowed disabled:bg-navy-50"
          />
          <p className="text-xs text-navy-500">
            Free accounts keep live research and core analysis. Full access temporarily opens analyst, team, and enterprise-grade tools.
          </p>
        </div>
        <button
          onClick={redeemCode}
          disabled={status.type === 'loading' || user?.isDemo}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-diplomatic-blue/90 disabled:cursor-not-allowed disabled:bg-navy-300"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {status.type === 'loading' ? 'Redeeming...' : 'Redeem'}
        </button>
      </div>
      {status.message && (
        <div
          className={cn(
            'mt-4 rounded-lg border px-3 py-2 text-xs',
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-gold-200 bg-gold-50 text-gold-700'
          )}
        >
          {status.message}
        </div>
      )}
    </SettingsSection>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Payment/upgrade banners */}
      <Suspense fallback={null}>
        <PaymentBanner />
      </Suspense>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-navy-500">
          Manage your account preferences, AI providers, and deployment configuration.
        </p>
      </div>

      {/* ── Profile ──────────────────────────────────────────────── */}
      <SettingsSection
        icon={User}
        title="Profile"
        description="Your personal information"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField icon={User} label="Full Name" value={user?.name || 'N/A'} />
          <ReadOnlyField icon={Mail} label="Email Address" value={user?.email || 'N/A'} />
          <ReadOnlyField icon={Briefcase} label="Role" value={user?.role || 'N/A'} />
          <ReadOnlyField icon={Shield} label="User ID" value={user?.id || 'N/A'} />
        </div>
        <p className="mt-4 text-xs text-navy-500">
          Profile information is managed by your organization administrator.
        </p>
      </SettingsSection>

      {/* ── Organization ─────────────────────────────────────────── */}
      <SettingsSection
        icon={Building2}
        title="Organization"
        description="Your organization details"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField
            icon={Building2}
            label="Organization Name"
            value={user?.orgName || 'N/A'}
          />
          <ReadOnlyField icon={Shield} label="Organization ID" value={user?.orgId || 'N/A'} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-navy-500">Plan:</span>
          <Badge variant="gold">{user?.subscription ?? 'free'}</Badge>
        </div>
      </SettingsSection>

      <FullAccessCodeSection />

      <SettingsSection
        icon={Briefcase}
        title="Boardroom Personas"
        description="Workspace-scoped experts for Agentic Boardroom deliberations"
      >
        <div className="flex items-center justify-between gap-4 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-navy-900">Custom persona authoring</p>
            <p className="mt-1 text-xs leading-5 text-navy-500">
              Define role, corpus manifest, voice profile, and tool affinity before including a persona in boardroom sessions.
            </p>
          </div>
          <PraxisLink
            href="/settings/personas"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-diplomatic-blue/90"
          >
            Manage personas
            <ArrowRight className="h-3.5 w-3.5" />
          </PraxisLink>
        </div>
      </SettingsSection>

      {/* ── AI Provider ───────────────────────────────────────────── */}
      <SettingsSection
        icon={Cpu}
        title="AI Provider"
        description="Active language model and deployment configuration"
      >
        <div className="space-y-3">
          {/* Active provider */}
          <div className="flex items-start justify-between rounded-lg border border-teal/25 bg-teal/4 px-4 py-3">
            <div className="flex items-start gap-3">
              <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Google AI Studio — Active
                </p>
                <p className="mt-0.5 text-xs text-navy-600">
                  Google AI · Tool Analysis · Live Research with Google Search grounding
                </p>
                <p className="mt-1 text-[11px] text-navy-500">
                  Env: <Code>GOOGLE_AI_API_KEY</Code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-semibold text-teal">
              <CheckCircle2 className="h-3 w-3" />
              Live
            </div>
          </div>

          {/* Vertex AI — next provider */}
          <div className="rounded-lg border border-dashed border-navy-200 bg-navy-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy-700">
                    Google Vertex AI
                  </p>
                  <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                    Production-ready
                  </span>
                </div>
                <p className="mt-1 text-xs text-navy-600">
                  Enterprise deployment with managed IAM, audit logging, VPC-SC, and SLA guarantees.
                  Enables data residency controls and private model endpoints.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-navy-200 bg-white p-2.5">
                    <p className="text-[10px] font-semibold text-navy-700 mb-1">Required env vars</p>
                    <div className="space-y-1">
                      <div><Code>AI_PROVIDER=vertex</Code></div>
                      <div><Code>GOOGLE_VERTEX_PROJECT=your-project-id</Code></div>
                      <div><Code>GOOGLE_VERTEX_LOCATION=us-central1</Code></div>
                    </div>
                  </div>
                  <div className="rounded-md border border-navy-200 bg-white p-2.5">
                    <p className="text-[10px] font-semibold text-navy-700 mb-1">Pipeline capabilities</p>
                    <div className="space-y-0.5 text-[10px] text-navy-600">
                      <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-sage" /> Gemini 2.5 Pro / Flash</div>
                      <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-sage" /> Grounded Search (Vertex)</div>
                      <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-sage" /> Function calling / tools</div>
                      <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-sage" /> Audit logs + VPC-SC</div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-navy-500">
                  See <Code>.env.example</Code> and <Code>src/lib/ai/providers.ts</Code> for full setup. The provider abstraction handles both AI Studio and Vertex AI with the same API surface.
                </p>
              </div>
            </div>
          </div>

          {/* Tools inventory */}
          <div className="rounded-lg border border-navy-200 bg-navy-50/50 px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-navy-700">Active AI Tools (13)</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'conflictSummary', 'actorAnalysis', 'escalationAssessment', 'negotiationSpaceAnalysis',
                'draftSection', 'keyMessageDraft', 'mediaCoverageAnalysis', 'earlyWarningSignals',
                'sanctionsScreening', 'documentAnalysis', 'scenarioModeling', 'talkingPointsGenerator',
                'conflictGraphQuery',
              ].map((tool) => (
                <span key={tool} className="rounded-full border border-navy-200 bg-white px-2 py-0.5 font-mono text-[10px] text-navy-600">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ── Research Engines ──────────────────────────────────────── */}
      <SettingsSection
        icon={Globe}
        title="Research Engines"
        description="Data sources and research capabilities available for intelligence gathering"
      >
        <div className="space-y-3">
          {/* Google Search Grounding */}
          <div className="flex items-start justify-between rounded-lg border border-teal/25 bg-teal/4 px-4 py-3">
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Google Search Grounding
                </p>
                <span className="text-[10px] font-medium text-navy-500">built-in</span>
                <p className="mt-0.5 text-xs text-navy-600">
                  Real-time web search via Google Search Grounding. Built into TACITUS platform credits.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Live search', 'Source citation', 'Multi-step research'].map((cap) => (
                    <span key={cap} className="rounded-full border border-navy-200 bg-white px-2 py-0.5 text-[10px] text-navy-600">
                      {cap}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-navy-500">
                  Env: <Code>GOOGLE_AI_API_KEY</Code> (already shown in AI Provider)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-semibold text-teal">
              <CheckCircle2 className="h-3 w-3" />
              Live
            </div>
          </div>

          {/* Deep Research Pipeline */}
          <div className="flex items-start justify-between rounded-lg border border-teal/25 bg-teal/4 px-4 py-3">
            <div className="flex items-start gap-3">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  Deep Research Pipeline
                </p>
                <span className="text-[10px] font-medium text-navy-500">built-in</span>
                <p className="mt-0.5 text-xs text-navy-600">
                  Multi-pass research pipeline supporting briefing preparation, background research, media scanning, and actor profiling.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['Briefing mode', 'Background mode', 'Media scan', 'Actor profiling'].map((cap) => (
                    <span key={cap} className="rounded-full border border-navy-200 bg-white px-2 py-0.5 text-[10px] text-navy-600">
                      {cap}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-navy-400">
                  Powered by primary AI provider with Google Search
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-semibold text-teal">
              <CheckCircle2 className="h-3 w-3" />
              Live
            </div>
          </div>

          {/* Premium research integrations */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gold-500/25 bg-gold-500/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-900">Google Grounding</p>
                    <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                      Premium
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navy-600">
                    Search, scrape, crawl, map, and structured extraction for PDFs, JS-rendered pages, source monitors, and knowledge-base ingestion.
                  </p>
                  <p className="mt-1 text-[11px] text-navy-500">
                    Credit-based. Broad crawls and extraction should run on paid/trial plans or through support.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-4 py-4">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-diplomatic-blue" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-900">Google Search grounding</p>
                    <span className="rounded-full bg-diplomatic-blue/15 px-2 py-0.5 text-[10px] font-semibold text-diplomatic-blue">
                      MCP + API
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-navy-600">
                    LLM-optimized web search for contested claims, second-source checks, entity enrichment, and agent research.
                  </p>
                  <p className="mt-1 text-[11px] text-navy-500">
                    Use basic search for routine work; reserve advanced/deep tasks for paid workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ── Deployment Pipeline ───────────────────────────────────── */}
      <SettingsSection
        icon={Layers}
        title="Deployment Pipeline"
        description="Platform deployment architecture and integration points"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-diplomatic-blue" />
              <p className="text-xs font-semibold text-navy-900">Frontend</p>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">Next.js 16 App Router · Cloud Run · React 19 · Tailwind CSS v4</p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-teal" />
              <p className="text-xs font-semibold text-navy-900">AI Layer</p>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">AI SDK v6 · Google AI / Vertex-ready · Tool-augmented generation · Streaming</p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-gold-600" />
              <p className="text-xs font-semibold text-navy-900">Data Layer</p>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">Conflict Grammar knowledge graph · Zustand stores · REST APIs (planned)</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-gold-500/20 bg-gold-500/4 px-4 py-3">
          <p className="text-xs font-semibold text-gold-700 mb-1">Production readiness checklist</p>
          <div className="grid gap-1 sm:grid-cols-2 text-[11px]">
            {[
              { done: true,  item: 'Provider abstraction (AI Studio / Vertex)' },
              { done: true,  item: 'Google Search Grounding (tools API)' },
              { done: true,  item: 'Streaming text responses (toTextStreamResponse)' },
              { done: true,  item: '13 domain-specific AI tools' },
              { done: false, item: 'Vertex AI IAM service account' },
              { done: false, item: 'Database persistence (Supabase / Firestore)' },
              { done: false, item: 'Authentication (Clerk / Supabase Auth)' },
              { done: false, item: 'Rate limiting & usage metering' },
            ].map(({ done, item }) => (
              <div key={item} className="flex items-center gap-1.5">
                {done
                  ? <CheckCircle2 className="h-3 w-3 shrink-0 text-sage" />
                  : <AlertCircle className="h-3 w-3 shrink-0 text-navy-400" />}
                <span className={done ? 'text-navy-700' : 'text-navy-400'}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* ── TACITUS Ecosystem Connections ──────────────────────────── */}
      <SettingsSection
        icon={Layers}
        title="TACITUS Ecosystem Connections"
        description="Connected products in the TACITUS intelligence platform"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: 'ARGUS',
              description: 'Graph-Augmented RAG Intelligence',
              status: 'Demo Mode' as const,
              endpoint: 'argus.tacitus.me/api/v1',
              stats: '847 entities | 12,400 relationships | Last sync: 5 min ago',
            },
            {
              name: 'CONCORDIA',
              description: 'AI Mediation Platform',
              status: 'Demo Mode' as const,
              endpoint: 'concordia.tacitus.me/api/v1',
              stats: '14 frameworks | 3 active sessions',
            },
            {
              name: 'WIND TUNNEL',
              description: 'Scenario Simulation Engine',
              status: 'Demo Mode' as const,
              endpoint: 'windtunnel.tacitus.me/api/v1',
              stats: '27 tribes | CiviSphere v2.0',
            },
            {
              name: 'CONFLICT COMPASS',
              description: 'Conflict Assessment Tool',
              status: 'Demo Mode' as const,
              endpoint: 'conflictcompass.tacitus.me/api/v1',
              stats: '4 active assessments',
            },
            {
              name: 'DIALECTICA',
              description: 'Ontology Backend (Core)',
              status: 'Infrastructure' as const,
              endpoint: 'internal',
              stats: 'ACO v2.0 | 8 primitives | 41 classes | 29 properties',
            },
          ].map((product) => (
            <div key={product.name} className="rounded-lg border border-[var(--color-app-border)] bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-navy-900">{product.name}</p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    product.status === 'Infrastructure'
                      ? 'bg-teal/10 text-teal'
                      : 'bg-gold-500/10 text-gold-700'
                  )}
                >
                  {product.status}
                </span>
              </div>
              <p className="text-[11px] text-navy-500 mb-2">{product.description}</p>
              <p className="font-mono text-[10px] text-diplomatic-blue mb-2">{product.endpoint}</p>
              <p className="text-[10px] text-navy-400">{product.stats}</p>
              <div className="mt-3 flex items-center gap-2" title="Available in production">
                <div className="relative h-4 w-7 rounded-full bg-navy-200 cursor-not-allowed">
                  <div className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-navy-400 transition-all" />
                </div>
                <span className="text-[10px] text-navy-400">Enable Live Connection</span>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* ── Conflict Grammar Configuration ─────────────────────────── */}
      <EcosystemACOSection />

      {/* ── Appearance ────────────────────────────────────────────── */}
      <SettingsSection
        icon={Palette}
        title="Appearance"
        description="Application theme and display settings"
      >
        <div className="flex items-center justify-between rounded-lg border border-navy-200 bg-navy-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Palette className="h-4 w-4 text-diplomatic-blue" />
            <div>
              <p className="text-sm font-medium text-navy-900">Light Institutional Theme</p>
              <p className="text-xs text-navy-500">
                Clean cream/white palette with diplomatic navy and gold accents. Optimized for readability.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[11px] font-semibold text-teal">Active</span>
        </div>
        <p className="mt-3 text-xs text-navy-500">
          Dark mode and high-contrast themes planned for future releases.
        </p>
      </SettingsSection>

      {/* ── Guided Tour ───────────────────────────────────────────── */}
      <SettingsSection
        icon={PlayCircle}
        title="Guided Tour"
        description="Restart the onboarding walkthrough"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-navy-700">Take a 2-minute tour of PRAXIS features.</p>
            <p className="text-xs text-navy-500 mt-1">Resets the welcome modal and walkthrough state.</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('praxis-tour-seen');
              localStorage.removeItem('praxis-visited-pages');
              window.location.href = '/dashboard';
            }}
            className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restart Tour
          </button>
        </div>
      </SettingsSection>

      {/* ── Notifications ──────────────────────────────────────────── */}
      <SettingsSection
        icon={Mail}
        title="Notifications"
        description="Tune case updates, quiet hours, and feedback prompts"
      >
        <div className="space-y-3">
          <p className="text-xs text-navy-600">
            Choose which source, research, memo, budget, and workspace events interrupt you immediately and which ones wait for a digest.
          </p>
          <PraxisLink
            href="/settings/notifications"
            className="inline-flex items-center gap-2 px-4 py-2 bg-diplomatic-blue hover:bg-diplomatic-blue/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Manage Notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </PraxisLink>
        </div>
      </SettingsSection>

      {/* ── API Keys ──────────────────────────────────────────────── */}
      <SettingsSection
        icon={Key}
        title="AI Provider Keys"
        description="Configure API keys for AI providers and web research"
      >
        <div className="space-y-3">
          <p className="text-xs text-navy-500">
            Add your own provider API keys to use PRAXIS with your accounts.
            Platform defaults are used when no key is provided.
          </p>
          <div className="flex gap-3">
            <PraxisLink
              href="/settings/api-keys"
              className="inline-flex items-center gap-2 px-4 py-2 bg-diplomatic-blue hover:bg-diplomatic-blue/90 text-white rounded-md text-sm font-medium transition-colors"
            >
              <Key className="h-3.5 w-3.5" />
              Manage API Keys
            </PraxisLink>
            <PraxisLink
              href="/settings/model-preferences"
              className="inline-flex items-center gap-2 px-4 py-2 border border-navy-200 hover:border-navy-400 text-navy-700 rounded-md text-sm font-medium transition-colors"
            >
              <Cpu className="h-3.5 w-3.5" />
              Model Preferences
            </PraxisLink>
          </div>
        </div>
      </SettingsSection>

      {/* ── System Health ─────────────────────────────────────────── */}
      <SettingsSection
        icon={Activity}
        title="System Health"
        description="Monitor AI providers, data feeds, and circuit breakers"
      >
        <div className="space-y-3">
          <p className="text-xs text-navy-500">
            Real-time status of all platform services including AI model availability,
            data feed health, and the Situation Knowledge Core (SKC) layers.
          </p>
          <PraxisLink
            href="/settings/system-health"
            className="inline-flex items-center gap-2 px-4 py-2 bg-diplomatic-blue hover:bg-diplomatic-blue/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            View System Health
            <ArrowRight className="h-3.5 w-3.5" />
          </PraxisLink>
        </div>
      </SettingsSection>

      {/* ── Graph Backend ─────────────────────────────────────────── */}
      <SettingsSection
        icon={GitBranch}
        title="Graph Backend"
        description="Choose where the conflict knowledge graph is stored"
      >
        <div className="space-y-3">
          <p className="text-xs text-navy-500">
            Select Neo4j AuraDB or FalkorDB as the graph database for PRAXIS conflict intelligence.
            Connection settings are stored in your user profile and should be treated as production secrets.
            Dialectica is tracked separately as the premium graph-reasoning adapter target.
          </p>
          <PraxisLink
            href="/settings/graph-backend"
            className="inline-flex items-center gap-2 px-4 py-2 bg-diplomatic-blue hover:bg-diplomatic-blue/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Server className="h-3.5 w-3.5" />
            Configure Graph Backend
            <ArrowRight className="h-3.5 w-3.5" />
          </PraxisLink>
          <PraxisLink
            href="/dialectica"
            className="ml-2 inline-flex items-center gap-2 px-4 py-2 border border-gold-500/30 bg-gold-500/10 hover:bg-gold-500/15 text-gold-800 rounded-md text-sm font-medium transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Dialectica Preview
          </PraxisLink>
        </div>
      </SettingsSection>
    </div>
  );
}

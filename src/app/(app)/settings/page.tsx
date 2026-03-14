'use client';

import {
  User,
  Building2,
  Palette,
  Key,
  Shield,
  Mail,
  Briefcase,
  Lock,
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
} from 'lucide-react';
import Link from 'next/link';
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
 * Component
 * -------------------------------------------------------------------------*/

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
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
          <Badge variant="gold">Demo</Badge>
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
                  Gemini 2.5 Flash · Tool Analysis · Live Research (Google Search Grounding)
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
            <p className="text-[11px] text-navy-600 leading-relaxed">Next.js 16 App Router · Vercel Edge · React 18 · Tailwind CSS v4</p>
          </div>
          <div className="rounded-lg border border-navy-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-teal" />
              <p className="text-xs font-semibold text-navy-900">AI Layer</p>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">Vercel AI SDK v6 · Gemini 2.5 Flash · Tool-augmented generation · Streaming</p>
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

      {/* ── API Keys ──────────────────────────────────────────────── */}
      <SettingsSection
        icon={Key}
        title="API Keys"
        description="Manage programmatic access tokens"
      >
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50 px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-100">
            <Lock className="h-5 w-5 text-navy-400" />
          </div>
          <p className="text-sm font-medium text-navy-700">
            API key management is restricted
          </p>
          <p className="mt-1 max-w-sm text-xs text-navy-500">
            Contact your organization administrator to create, rotate, or revoke API access
            tokens for the PRAXIS platform.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

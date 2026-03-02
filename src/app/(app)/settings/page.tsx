'use client';

import {
  User,
  Building2,
  Palette,
  Key,
  Moon,
  Shield,
  Mail,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Badge } from '@/components/ui/badge';

/* ---------------------------------------------------------------------------
 * Section wrapper
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
    <div className="rounded-lg border border-navy-700/50 bg-navy-800">
      <div className="border-b border-navy-700/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-700/50">
            <Icon className="h-4 w-4 text-navy-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-navy-50">{title}</h2>
            <p className="text-xs text-navy-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Read-only field
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
      <label className="flex items-center gap-1.5 text-xs font-medium text-navy-400">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <div className="rounded-md border border-navy-700/50 bg-navy-900/50 px-3 py-2 text-sm text-navy-200">
        {value}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------*/

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-navy-50">Settings</h1>
        <p className="mt-1 text-sm text-navy-400">
          Manage your account preferences and organization settings.
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
          <span className="text-xs text-navy-400">Plan:</span>
          <Badge variant="gold">Demo</Badge>
        </div>
      </SettingsSection>

      {/* ── Appearance ────────────────────────────────────────────── */}
      <SettingsSection
        icon={Palette}
        title="Appearance"
        description="Customize the look and feel"
      >
        <div className="flex items-center justify-between rounded-md border border-navy-700/50 bg-navy-900/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Moon className="h-4 w-4 text-navy-300" />
            <div>
              <p className="text-sm font-medium text-navy-100">Dark Mode</p>
              <p className="text-xs text-navy-400">
                TACITUS uses a dark theme optimized for extended analysis sessions.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="flex h-6 w-11 cursor-not-allowed items-center rounded-full bg-gold-500/30 px-0.5">
              <div className="h-5 w-5 translate-x-5 transform rounded-full bg-gold-500 shadow-sm transition-transform" />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-navy-500">
          Additional themes will be available in a future release.
        </p>
      </SettingsSection>

      {/* ── API Keys ──────────────────────────────────────────────── */}
      <SettingsSection
        icon={Key}
        title="API Keys"
        description="Manage programmatic access tokens"
      >
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-navy-700 bg-navy-900/30 px-6 py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-700/50">
            <Lock className="h-5 w-5 text-navy-400" />
          </div>
          <p className="text-sm font-medium text-navy-300">
            API key management is restricted
          </p>
          <p className="mt-1 max-w-sm text-xs text-navy-500">
            Contact your organization administrator to create, rotate, or revoke API access
            tokens for the TACITUS platform.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

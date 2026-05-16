'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  KeyRound,
  LogOut,
  Settings,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';

export function AccountProfileButton({ compact = false }: { compact?: boolean }) {
  const { user, analystProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => {
    const source = user?.name || user?.email || 'Analyst';
    return source
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A';
  }, [user?.email, user?.name]);
  const org = analystProfile?.identity.org || user?.orgName || 'No organization set';
  const team = analystProfile?.identity.team || 'No team set';
  const role = analystProfile?.identity.role?.replaceAll('_', ' ') || user?.role || 'analyst';
  const plan = user?.subscription || 'free';

  async function signOut() {
    setOpen(false);
    await logout();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-left text-sm shadow-sm transition hover:border-navy-300 hover:bg-slate-50',
          compact ? 'max-w-[12rem]' : 'max-w-[18rem]',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue text-xs font-bold text-white">
          {initials}
        </span>
        {!compact ? (
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold text-navy-950">{user?.name || 'Analyst'}</span>
            <span className="block truncate text-[11px] text-navy-500">{org}</span>
          </span>
        ) : null}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-navy-400" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-navy-950/15"
          >
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue text-sm font-bold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-950">{user?.name || 'Analyst'}</p>
                  <p className="truncate text-xs text-navy-500">{user?.email}</p>
                  <p className="mt-1 inline-flex rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-800">
                    {plan} plan
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                <Detail icon={Building2} label="Organization" value={org} />
                <Detail icon={UsersRound} label="Team" value={team} />
                <Detail icon={UserRound} label="Role" value={role} />
              </div>
            </div>

            <div className="mt-2 grid gap-1">
              <MenuLink href="/app/settings/profile" icon={UserRound} label="Profile / User Core" onClick={() => setOpen(false)} />
              <MenuLink href="/app/settings/api-keys" icon={KeyRound} label="Connectors and API keys" onClick={() => setOpen(false)} />
              <MenuLink href="/app/settings" icon={Settings} label="Workspace settings" onClick={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-crimson hover:bg-crimson/5"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-navy-400" />
      <span className="w-20 shrink-0 text-navy-400">{label}</span>
      <span className="min-w-0 truncate font-medium capitalize text-navy-800">{value}</span>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof UserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-700 hover:bg-slate-50 hover:text-navy-950"
    >
      <Icon className="h-4 w-4 text-navy-400" />
      {label}
    </Link>
  );
}

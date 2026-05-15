import Link from 'next/link';
import type { ComponentType } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface HeaderAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface AppPageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  aside?: ReactNode;
}

export function AppPageHeader({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  aside,
}: AppPageHeaderProps) {
  return (
    <header className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-sm shadow-navy-950/5 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">{eyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-navy-950 md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {aside}
          {secondaryAction ? <HeaderLink action={secondaryAction} tone="secondary" /> : null}
          {primaryAction ? <HeaderLink action={primaryAction} tone="primary" /> : null}
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  action,
  tone,
}: {
  action: HeaderAction;
  tone: 'primary' | 'secondary';
}) {
  const Icon = action.icon as ComponentType<{ className?: string }> | undefined;
  return (
    <Link
      href={action.href}
      className={
        tone === 'primary'
          ? 'inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800'
          : 'inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50'
      }
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {action.label}
    </Link>
  );
}

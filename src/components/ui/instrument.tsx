'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ComponentType, type HTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { PublicShell } from '@/components/app/public-shell';
import { cn } from '@/lib/utils/cn';

type InstrumentTone = 'paper' | 'vellum' | 'dark';
type RailState = 'ready' | 'active' | 'review' | 'quiet' | 'blocked';

export function InstrumentSurface({
  children,
  className,
  tone = 'paper',
}: {
  children: ReactNode;
  className?: string;
  tone?: InstrumentTone;
}) {
  return (
    <div
      className={cn(
        'instrument-surface',
        tone === 'vellum' && 'instrument-surface-vellum',
        tone === 'dark' && 'instrument-surface-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InstrumentWindow({
  title,
  eyebrow,
  actions,
  children,
  className,
}: {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('instrument-window', className)}>
      {(title || eyebrow || actions) ? (
        <div className="instrument-window-header">
          <div className="min-w-0">
            {eyebrow ? <p className="instrument-eyebrow">{eyebrow}</p> : null}
            {title ? <h2 className="truncate font-serif text-lg font-semibold text-[color:var(--color-deep-ink)]">{title}</h2> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function InstrumentToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('instrument-toolbar', className)}>{children}</div>;
}

export function InstrumentButton({
  children,
  className,
  active = false,
  as = 'button',
  href,
  ...props
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  as?: 'button' | 'link';
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn('instrument-button', active && 'instrument-button-active', className);
  if (as === 'link' && href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

export function LivingContextRail({
  cells,
  actionHref,
  actionLabel = 'Change context',
  className,
  compact = false,
}: {
  cells: Array<{
    id: string;
    label: string;
    value: string;
    detail?: string;
    state?: RailState;
    icon?: ComponentType<{ className?: string }>;
    href?: string;
  }>;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('living-context-rail', compact && 'living-context-rail-compact', className)} data-testid="living-context-rail">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {cells.map((cell) => (
          <StatusCell key={cell.id} {...cell} />
        ))}
      </div>
      {actionHref ? (
        <Link href={actionHref} className="living-context-action">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatusCell({
  label,
  value,
  detail,
  state = 'quiet',
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  state?: RailState;
  icon?: ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <>
      <span className={cn('living-context-pulse', `living-context-pulse-${state}`)} />
      {Icon ? (
        <span className="living-context-icon">
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-evidence-muted)]">{label}</span>
        <span className="block truncate text-xs font-semibold text-[color:var(--color-deep-ink)]">{value}</span>
        {detail ? <span className="block truncate text-[11px] text-[color:var(--color-mineral)]">{detail}</span> : null}
      </span>
    </>
  );

  const className = cn('living-context-cell', `living-context-cell-${state}`);
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function SourcePostureChip({
  label,
  state = 'review',
  className,
}: {
  label: string;
  state?: RailState;
  className?: string;
}) {
  return <span className={cn('source-posture-chip', `source-posture-chip-${state}`, className)}>{label}</span>;
}

export function InstrumentSkeleton({
  className,
  dark = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  dark?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('praxis-skeleton', dark && 'praxis-skeleton-dark', className)}
      {...props}
    />
  );
}

export function WorkActionMenu({
  label = 'Work on this',
  children,
  className,
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();
  const hasMenu = Boolean(children);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!hasMenu) {
    return (
      <button ref={buttonRef} type="button" className={cn('work-action-menu', className)} aria-label={label}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        className={cn('work-action-menu', className)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          data-testid="work-action-menu-panel"
          className="praxis-menu-panel absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-64 gap-1 p-2"
          onClick={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('button,a')) setOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function PublicPageShell({
  children,
  maxWidth = 'max-w-6xl',
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <PublicShell contentClassName="px-5 py-10">
      <div className={cn('praxis-enter mx-auto', maxWidth)}>{children}</div>
    </PublicShell>
  );
}

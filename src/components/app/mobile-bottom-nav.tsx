'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { FolderKanban, Home, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_GROUPS, type PrimaryNavIcon } from '@/lib/navigation/primary-nav';

// Mobile mirrors the six-room product contract while keeping labels short.
const ICONS: Partial<Record<PrimaryNavIcon, ComponentType<{ className?: string }>>> = {
  Home,
  Sparkles,
  FolderKanban,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const workspace = NAV_GROUPS.find((g) => g.id === 'workspace');
  const items = workspace?.items ?? [];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lg shadow-navy-950/10 backdrop-blur md:hidden"
      aria-label="Primary mobile navigation"
      data-testid="mobile-bottom-nav"
    >
      <div
        className="mx-auto grid max-w-lg gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? Sparkles;
          if (item.id === 'ask') {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-gold-700 hover:bg-gold-50"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          }
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <MobileLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active}
              icon={Icon}
            />
          );
        })}
      </div>
    </nav>
  );
}

function MobileLink({
  href,
  label,
  active,
  icon: Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold transition',
        active ? 'bg-navy-50 text-navy-950' : 'text-slate-700 hover:bg-slate-50 hover:text-navy-900',
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

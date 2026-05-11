'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { FileText, Home, MoreHorizontal, Sparkles, Target } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSituationStore } from '@/stores/situation-store';
import { cn } from '@/lib/utils/cn';

type MobileNavItem =
  | { kind: 'query'; label: string; queryKey: 'tab' | 'openChapter'; queryValue: string; icon: ComponentType<{ className?: string }> }
  | { kind: 'link'; label: string; href: string; icon: ComponentType<{ className?: string }> };

const navItems: MobileNavItem[] = [
  { kind: 'link', label: 'Context', href: '/app/cores/context', icon: Target },
  { kind: 'query', label: 'Outputs', queryKey: 'openChapter', queryValue: 'draft', icon: FileText },
  { kind: 'link', label: 'More', href: '/app/tools', icon: MoreHorizontal },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCaseId = activeSituation?.id ?? situations[0]?.id ?? 'syria-2026';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lg shadow-navy-950/10 backdrop-blur md:hidden"
      aria-label="Primary mobile navigation"
      data-testid="mobile-bottom-nav"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        <MobileLink href="/app/dashboard" label="Home" active={pathname === '/app/dashboard'} icon={Home} />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-gold-700 hover:bg-gold-50"
        >
          <Sparkles className="h-5 w-5" />
          Ask
        </button>
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.kind === 'link') {
            return <MobileLink key={item.label} href={item.href} label={item.label} active={pathname.startsWith(item.href)} icon={Icon} />;
          }
          const href = `/app/workbench/${activeCaseId}?${item.queryKey}=${item.queryValue}`;
          const active = searchParams.get(item.queryKey) === item.queryValue;
          return <MobileLink key={item.label} href={href} label={item.label} active={active} icon={Icon} />;
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

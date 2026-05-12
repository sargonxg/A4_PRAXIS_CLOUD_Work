'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { FileText, FolderKanban, Settings, Sparkles, Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { PRIMARY_NAV } from '@/lib/navigation/primary-nav';

const ICONS = { Sparkles, FolderKanban, FileText, Wrench, Settings };

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-lg shadow-navy-950/10 backdrop-blur md:hidden"
      aria-label="Primary mobile navigation"
      data-testid="mobile-bottom-nav"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {PRIMARY_NAV.map((item) => item.id === 'ask' ? (
          <button
            key={item.id}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-gold-700 hover:bg-gold-50"
          >
            <Sparkles className="h-5 w-5" />
            {item.label}
          </button>
        ) : (
          <MobileLink
            key={item.id}
            href={item.href}
            label={item.label}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            icon={ICONS[item.icon]}
          />
        ))}
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

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { PraxisMark } from '@/components/brand/praxis-mark';
import { PraxisRouteTransition } from '@/components/ui/praxis-motion';
import { PUBLIC_FOOTER_LINKS, PUBLIC_NAV_ITEMS } from '@/lib/navigation/primary-nav';
import { cn } from '@/lib/utils/cn';

export function PublicShell({
  children,
  className,
  contentClassName,
  showFooter = true,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showFooter?: boolean;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    document.documentElement.dataset.praxisHydrated = 'true';
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      delete document.documentElement.dataset.praxisHydrated;
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  return (
    <div id="top" className={cn('landing-light praxis-public-shell relative min-h-screen', className)}>
      <a href="#public-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:p-3 focus:text-slate-950">Skip to content</a>
      <div className="landing-sticky-collision-zone sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-5 sm:pb-3 sm:pt-4">
        <header
          className={cn(
            'praxis-public-header mx-auto max-w-[1180px] transition-all duration-300 ease-out',
            scrolled ? 'bg-white/90' : 'bg-white/76',
          )}
        >
          <nav aria-label="Main navigation" className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
            <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-emerald-500/35 bg-emerald-500/10 transition-transform duration-300 group-hover:rotate-[8deg]">
                <PraxisMark size={20} className="text-emerald-700" title="PRAXIS" />
              </span>
              <span className="font-serif text-[20px] font-semibold tracking-normal text-[color:var(--color-diplomatic-blue)] sm:text-[22px]">
                PRAXIS
              </span>
              <span className="hidden rounded-[var(--radius-full)] bg-[color:var(--color-praxis-emerald-500)]/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[color:var(--color-app-text)] sm:inline-flex">
                by TACITUS
              </span>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {PUBLIC_NAV_ITEMS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="praxis-nav-link relative rounded-[var(--radius-full)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--color-app-text-secondary)] transition-colors duration-200 hover:text-[color:var(--color-app-text)]"
                  {...(link.href.startsWith('http') ? { rel: 'noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" prefetch={false} data-testid="public-sign-in-affordance" className="praxis-button-secondary h-9 px-4 text-[14px]">
                Sign in
              </Link>
              <Link href="/login?mode=signup" prefetch={false} className="praxis-button-primary h-9 px-5 text-[14px]">
                Start work
              </Link>
            </div>

            <button
              ref={menuButton}
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="praxis-button-secondary h-9 w-9 p-0 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </header>

        <div
          id="mobile-menu"
          inert={!mobileMenuOpen}
          aria-hidden={!mobileMenuOpen}
          className={cn(
            'praxis-shell-float mx-auto mt-2 max-w-[1180px] overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:hidden',
            mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 border-transparent opacity-0 shadow-none',
          )}
        >
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-col">
              {PUBLIC_NAV_ITEMS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-[var(--color-app-border)] py-4 text-base font-medium text-[color:var(--color-app-text-secondary)] transition-colors hover:text-[color:var(--color-app-text)]"
                  {...(link.href.startsWith('http') ? { rel: 'noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/login"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="praxis-button-secondary min-h-11 px-5 text-[15px]"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="praxis-button-primary min-h-11 px-6 text-[15px]"
              >
                Start work
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main id="public-main" tabIndex={-1} className={cn('relative z-10', contentClassName)}>
        <PraxisRouteTransition>{children}</PraxisRouteTransition>
      </main>

      {showFooter ? (
        <footer className="relative z-10 mt-16 px-3 pb-6 sm:px-5">
          <div className="praxis-public-footer mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row sm:gap-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] border border-emerald-500/35 bg-emerald-500/10 transition-transform duration-300 group-hover:rotate-[8deg]">
                <PraxisMark size={15} className="text-emerald-700" />
              </span>
              <span className="font-serif text-base font-semibold tracking-wide text-[color:var(--color-diplomatic-blue)]">
                PRAXIS
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-app-text-muted)]">
                by TACITUS · v6.5.0
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[color:var(--color-app-text-secondary)]">
              <a href="mailto:hello@tacitus.me" className="praxis-link hover:text-[color:var(--color-app-text)]">
                Contact
              </a>
              <Link href="/release-notes" className="praxis-link hover:text-[color:var(--color-app-text)]">
                Release notes
              </Link>
              {PUBLIC_FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="praxis-link hover:text-[color:var(--color-app-text)]">
                  {link.label}
                </Link>
              ))}
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-app-text-muted)]">
                © 2026 · TACITUS
              </span>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}

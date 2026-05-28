"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Menu, X } from "lucide-react";
import { PraxisMark } from "@/components/brand/praxis-mark";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Capsules", href: "/login?mode=signup&redirect=%2Fapp%2Fcapsules" },
  { label: "Pricing", href: "/pricing" },
  { label: "Learn", href: "/learn" },
  { label: "Release notes", href: "/release-notes" },
];

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "GDPR", href: "/legal/gdpr" },
  { label: "DPA", href: "/legal/data-processing" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Security", href: "/legal/security" },
  { label: "Sub-processors", href: "/legal/sub-processors" },
  { label: "Data retention", href: "/legal/data-retention" },
];

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    document.documentElement.dataset.praxisHydrated = "true";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      delete document.documentElement.dataset.praxisHydrated;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div
      id="top"
      className="landing-light relative min-h-screen bg-[var(--color-cream-100)] paper-texture"
    >
      {/* Atmospheric gold spotlight — anchors the page in the brand color */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[480px]"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(232,185,49,0.08), transparent 70%)",
        }}
      />

      {/* Floating capsule navbar — rounded, glass, deliberate */}
      <div className="landing-sticky-collision-zone sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-5 sm:pb-3 sm:pt-4">
        <header
          className={cn(
            "mx-auto max-w-[1180px] rounded-full transition-all duration-500 ease-out",
            scrolled
              ? "surface-glass border border-[color:var(--color-rose-gold)]/35 shadow-capsule"
              : "border border-transparent",
          )}
        >
          <nav
            className={cn(
              "flex items-center justify-between gap-3 transition-all duration-500 ease-out",
              scrolled ? "px-4 py-2 sm:px-5" : "px-4 py-2.5 sm:px-6",
            )}
          >
            {/* Brand */}
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 sm:gap-3"
              aria-label="PRAXIS home"
            >
              {/* Glyph chip — anchors the brand color in a rounded square */}
              <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-[color:var(--color-rose-gold)]/40 bg-gradient-to-br from-[color:var(--color-gold-500)]/20 to-[color:var(--color-gold-500)]/5 transition-transform duration-500 group-hover:rotate-[8deg]">
                <PraxisMark
                  size={20}
                  className="text-[color:var(--color-gold-700)]"
                  title="PRAXIS"
                />
              </span>
              <span className="font-serif text-[20px] font-semibold tracking-[-0.01em] text-[color:var(--color-diplomatic-blue)] sm:text-[22px]">
                PRAXIS
              </span>
              <span className="hidden rounded-full bg-[color:var(--color-gold-500)]/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[color:var(--color-gold-700)] sm:inline-flex">
                by TACITUS
              </span>
              <span
                aria-label="Beta release"
                className="hidden items-center gap-1 rounded-full bg-[color:var(--color-terracotta)]/12 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-[color:var(--color-terracotta)] sm:inline-flex"
              >
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-terracotta)]" />
                Beta
              </span>
            </Link>

            {/* Desktop nav links — rounded pill row */}
            <div className="hidden items-center rounded-full px-1 lg:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="praxis-nav-link relative rounded-full px-3 py-1.5 text-[13px] font-medium text-[color:var(--color-ink)]/65 transition-colors duration-200 hover:text-[color:var(--color-ink)]"
                  {...(link.href.startsWith('http') ? { rel: 'noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/login"
                prefetch={false}
                className="btn-capsule-secondary inline-flex h-9 items-center justify-center rounded-full px-4 font-serif text-[14px] font-semibold tracking-tight"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                prefetch={false}
                className="btn-capsule-primary inline-flex h-9 items-center justify-center rounded-full px-5 font-serif text-[14px] font-semibold tracking-tight"
              >
                New capsule
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[color:var(--color-rose-gold)]/40 bg-white/70 text-[color:var(--color-ink)] backdrop-blur transition-all hover:bg-white hover:shadow-capsule lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </header>

        {/* Mobile drawer */}
        <div
          id="mobile-menu"
          className={cn(
            "mx-auto mt-2 max-w-[1180px] overflow-hidden rounded-3xl transition-[max-height,opacity] duration-300 ease-out lg:hidden",
            mobileMenuOpen
              ? "max-h-[80vh] opacity-100 surface-glass border border-[color:var(--color-rose-gold)]/30 shadow-capsule-lg"
              : "max-h-0 opacity-0",
          )}
        >
          <div className="px-6 pb-6 pt-3">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-[color:var(--color-rose-gold)]/15 py-4 text-base font-medium text-[color:var(--color-ink)]/80 transition-colors hover:text-[color:var(--color-ink)]"
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
                className="btn-capsule-secondary inline-flex h-11 items-center justify-center rounded-full px-5 font-serif text-[15px] font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/login?mode=signup"
                prefetch={false}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-capsule-primary inline-flex h-11 items-center justify-center rounded-full px-6 font-serif text-[15px] font-semibold"
              >
                New capsule
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="relative z-10">{children}</main>

      {/* Footer — compact brand/contact row; public route navigation lives only in the header. */}
      <footer className="relative z-10 mt-24 px-3 pb-6 sm:px-5">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 rounded-3xl border border-[color:var(--color-rose-gold)]/25 bg-white/45 px-6 py-5 backdrop-blur-md sm:flex-row sm:gap-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-[color:var(--color-rose-gold)]/40 bg-gradient-to-br from-[color:var(--color-gold-500)]/20 to-[color:var(--color-gold-500)]/5 transition-transform duration-500 group-hover:rotate-[8deg]">
              <PraxisMark size={15} className="text-[color:var(--color-gold-700)]" />
            </span>
            <span className="font-serif text-base font-semibold tracking-wide text-[color:var(--color-diplomatic-blue)]">
              PRAXIS
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45">
              by TACITUS · v6.4
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[color:var(--color-ink)]/65">
            <a
              href="mailto:hello@tacitus.me"
              className="praxis-link hover:text-[color:var(--color-ink)]"
            >
              Contact
            </a>
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="praxis-link hover:text-[color:var(--color-ink)]"
              >
                {link.label}
              </Link>
            ))}
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/40">
              © 2026 · TACITUS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

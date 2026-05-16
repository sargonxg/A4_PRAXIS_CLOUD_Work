"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Menu, X } from "lucide-react";
import { PraxisMark } from "@/components/brand/praxis-mark";

const navLinks = [
  { label: "Learn", href: "/learn" },
  { label: "Pricing", href: "/pricing" },
  { label: "Release notes", href: "/release-notes" },
  { label: "TACITUS", href: "/tacitus" },
];

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while mobile menu is open
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
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 ease-out",
          scrolled
            ? "border-b border-[color:var(--color-rose-gold)]/30 bg-[var(--color-cream-100)]/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 ease-out lg:px-8",
            scrolled ? "py-3" : "py-5"
          )}
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="PRAXIS home"
          >
            <PraxisMark
              size={26}
              className="text-[color:var(--color-gold-600)] transition-transform duration-300 group-hover:rotate-12"
              title="PRAXIS"
            />
            <span className="font-serif text-[22px] font-semibold tracking-wide text-[color:var(--color-diplomatic-blue)] sm:text-2xl">
              PRAXIS
            </span>
            <span className="hidden rounded-full border border-[color:var(--color-rose-gold)]/40 bg-[color:var(--color-gold-500)]/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-gold-700)] transition-colors group-hover:bg-[color:var(--color-gold-500)]/14 sm:inline-flex">
              by TACITUS
            </span>
            <span
              aria-label="Beta release"
              className="hidden items-center gap-1 rounded-full bg-[color:var(--color-terracotta)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-terracotta)] sm:inline-flex"
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-terracotta)]" />
              Beta
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-[color:var(--color-ink)]/70 transition-colors duration-200 hover:text-[color:var(--color-ink)]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              prefetch={false}
              className="btn-capsule-secondary inline-flex h-10 items-center justify-center rounded-full px-5 font-serif text-[15px] font-semibold tracking-tight"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              prefetch={false}
              className="btn-capsule-primary inline-flex h-10 items-center justify-center rounded-full px-6 font-serif text-[15px] font-semibold tracking-tight"
            >
              New capsule
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-rose-gold)]/40 bg-white/60 text-[color:var(--color-ink)] backdrop-blur transition-all hover:bg-white hover:shadow-capsule lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* Mobile menu — full-width drawer */}
        <div
          id="mobile-menu"
          className={cn(
            "overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:hidden",
            mobileMenuOpen
              ? "max-h-[80vh] opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-[color:var(--color-rose-gold)]/25 bg-white/95 px-6 pb-6 pt-3 backdrop-blur-xl">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-[color:var(--color-rose-gold)]/15 py-4 text-base font-medium text-[color:var(--color-ink)]/80 transition-colors hover:text-[color:var(--color-ink)]"
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
                Sign In
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
      </header>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer — institutional, single line, rose-gold hairline */}
      <footer className="relative z-10 mt-24 border-t border-[color:var(--color-rose-gold)]/25 bg-[var(--color-cream-100)]/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <PraxisMark size={18} className="text-[color:var(--color-gold-600)]" />
            <span className="font-serif text-base font-semibold tracking-wide text-[color:var(--color-diplomatic-blue)]">
              PRAXIS
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/45">
              by TACITUS · v6.4
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[color:var(--color-ink)]/65">
            <Link href="/learn" className="hover:text-[color:var(--color-ink)]">
              Learn
            </Link>
            <Link href="/pricing" className="hover:text-[color:var(--color-ink)]">
              Pricing
            </Link>
            <Link href="/release-notes" className="hover:text-[color:var(--color-ink)]">
              Release notes
            </Link>
            <Link href="/tacitus" className="hover:text-[color:var(--color-ink)]">
              TACITUS
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-ink)]/40">
              © 2026
            </span>
          </nav>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Learn", href: "/learn" },
  { label: "TACITUS", href: "/tacitus" },
  { label: "Pricing", href: "/pricing" },
  { label: "Release notes", href: "/release-notes" },
];

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress((window.scrollY / docHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div id="top" className="landing-light paper-texture relative min-h-screen">
      {/* Preview banner — normal flow, scrolls away naturally */}
      <div className="relative z-[60] bg-diplomatic-blue px-4 py-2 text-center text-xs text-white/90">
        <span className="font-semibold tracking-wide uppercase text-gold-400">MVP</span>
        {" "}— PRAXIS is becoming a ContextCapsule-native policy agent workspace.{" "}
        <a href="mailto:hello@tacitus.me" className="underline underline-offset-2 hover:text-white transition-colors">
          Write us at hello@tacitus.me
        </a>
      </div>

      {/* Scroll progress indicator */}
      <div
        className="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation — sticky so it sticks after banner scrolls away */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-cream-300/60 shadow-sm"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="font-serif text-2xl font-semibold tracking-wide text-diplomatic-blue">
              PRAXIS
            </span>
            <span className="rounded-full bg-gold-600/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700">
              by TACITUS
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-navy-600 transition-colors duration-200 hover:text-navy-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/login"
              prefetch={false}
              className="text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
            >
              Sign In
            </Link>
            <Link
              href="/app/assistant"
              prefetch={false}
              className="text-sm font-semibold text-gold-700 transition-colors hover:text-gold-800"
            >
              New capsule
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-navy-600 transition-colors hover:bg-cream-200 hover:text-navy-900 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 lg:hidden",
            mobileMenuOpen ? "max-h-96" : "max-h-0"
          )}
        >
          <div className="border-t border-cream-300/50 bg-white/95 px-6 pb-4 pt-2 backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900"
            >
              Sign In
            </Link>
            <Link
              href="/app/assistant"
              prefetch={false}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-sm font-semibold text-gold-700 transition-colors hover:text-gold-800"
            >
              New capsule
            </Link>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}

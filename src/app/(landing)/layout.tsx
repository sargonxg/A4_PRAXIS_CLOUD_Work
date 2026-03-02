"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Platform", href: "#features" },
  { label: "About", href: "#conflict-grammar" },
  { label: "Pricing", href: "#cta" },
];

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-navy-950">
      {/* Navigation */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-navy-900/95 backdrop-blur-md border-b border-navy-800/50 shadow-lg shadow-black/20"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-normal uppercase tracking-[0.25em] text-gold-500">
              Tacitus
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium tracking-wide text-navy-300 transition-colors duration-200 hover:text-navy-100"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <a
              href="#cta"
              className="inline-flex items-center justify-center rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all duration-200 hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20 active:bg-gold-600"
            >
              Request Access
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-navy-300 transition-colors hover:bg-navy-800 hover:text-navy-100 md:hidden"
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
            "overflow-hidden transition-all duration-300 md:hidden",
            mobileMenuOpen ? "max-h-64" : "max-h-0"
          )}
        >
          <div className="border-t border-navy-800/50 bg-navy-900/95 px-6 pb-4 pt-2 backdrop-blur-md">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-sm font-medium tracking-wide text-navy-300 transition-colors hover:text-navy-100"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block w-full rounded-md bg-gold-500 px-5 py-2.5 text-center text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
            >
              Request Access
            </a>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}

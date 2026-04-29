"use client";

/**
 * Testimonials strip.
 *
 * Keep this section hidden until there are real approved practitioner quotes.
 * PRAXIS should not use placeholder social proof on a trust-sensitive product.
 */

import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  org: string;
  photoUrl?: string | null;
}

const TESTIMONIALS: Testimonial[] = [];

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="relative w-full bg-cream-50/40 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.14em] text-navy-400">
          From practitioners
        </p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col gap-4 rounded-xl border border-diplomatic-blue/10 bg-white/80 p-6 shadow-sm"
            >
              <Quote className="h-5 w-5 text-gold-600/80" />
              <blockquote className="font-serif text-lg leading-relaxed text-navy-900">
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3 border-t border-cream-200/80 pt-4">
                {t.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photoUrl}
                    alt={t.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-xs font-semibold text-diplomatic-blue">
                    {initials(t.name)}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-navy-900">{t.name}</span>
                  <span className="text-xs text-navy-500">
                    {t.title} · {t.org}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

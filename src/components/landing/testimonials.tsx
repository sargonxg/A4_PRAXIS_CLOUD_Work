"use client";

/**
 * Testimonials strip — one real practitioner quote with a photo + org.
 *
 * The current entry is a placeholder clearly marked as such so the section
 * renders at release without misrepresenting anyone. Replace the single
 * `PLACEHOLDER_TESTIMONIAL` object with the collected quote + photo + org.
 * Add additional testimonials to TESTIMONIALS as they arrive.
 *
 * Design: deliberately compact — single rotating card at narrow widths, up
 * to two side-by-side at >= lg. Keeps landing height in check.
 */

import { Quote } from "lucide-react";

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  org: string;
  photoUrl?: string | null;
  placeholder?: boolean;
}

const PLACEHOLDER_TESTIMONIAL: Testimonial = {
  id: "placeholder-1",
  quote:
    "PRAXIS compresses the distance between raw source material and a brief I can actually send. The calibration to my role and red lines is the difference.",
  name: "Practitioner quote pending",
  title: "Political Affairs Officer",
  org: "Multilateral Mission",
  placeholder: true,
};

const TESTIMONIALS: Testimonial[] = [PLACEHOLDER_TESTIMONIAL];

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
                  {t.placeholder ? (
                    <span className="mt-0.5 text-[10px] uppercase tracking-wider text-gold-600">
                      Placeholder — collecting quotes
                    </span>
                  ) : null}
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

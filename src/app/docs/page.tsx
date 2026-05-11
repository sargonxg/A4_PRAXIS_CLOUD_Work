import Link from "next/link";

const links = [
  { href: "/demo/indo-pacific-2026", label: "Indo-Pacific demo context" },
  { href: "/demo/ai-regulation-2026", label: "AI regulation demo context" },
  { href: "/demo/fb-sustainability-2026", label: "Food and beverage demo context" },
  { href: "/methods", label: "Methods catalog" },
  { href: "/legal/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f7f3e8] px-4 py-12 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a5a00]">PRAXIS docs</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">Start with the public demo.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#374151]">
          These public links cover the current PRAXIS demo path: example contexts, methods, and trust pages.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-[#d7c89f] bg-white p-4 text-sm font-semibold transition hover:border-[#8a5a00]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Demo", href: "/demo/dashboard" },
      { label: "Pricing", href: "/pricing" },
      { label: "Report Studio", href: "/demo/reports" },
      { label: "PRAXIS Assistant", href: "/demo/assistant" },
      { label: "Conflict Graph", href: "/demo/conflict-graph" },
      { label: "Deep Search Agent", href: "/demo/deep-search-agent" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Talking Points", href: "/demo/talking-points" },
      { label: "Stakeholder Mapper", href: "/demo/stakeholder-map" },
      { label: "Risk Monitor", href: "/demo/risk-monitor" },
      { label: "Scenarios", href: "/demo/scenarios" },
      { label: "Document Vault", href: "/demo/documents" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "TACITUS", href: "https://tacitus.me" },
      { label: "Concordia Discors", href: "https://concordiadiscors.org" },
      { label: "Advisory Council", href: "#advisory" },
      { label: "Security", href: "#security" },
      { label: "Contact Us", href: "mailto:hello@tacitus.me" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-cream-300/60 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Top section */}
        <div className="grid gap-12 md:grid-cols-6">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
            >
              <span className="font-serif text-xl font-semibold tracking-wide text-diplomatic-blue">
                TACITUS
              </span>
            </Link>
            <p className="mt-3 text-sm text-navy-500 leading-relaxed">
              PRAXIS by TACITUS — Diplomacy. Evolved.
            </p>
            <p className="mt-1 text-xs text-navy-400">
              The intelligence workspace for peace and security professionals.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gold-600/30 bg-gold-600/5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                Early Demo
              </span>
            </div>
            <p className="mt-3 text-xs text-navy-400">
              Feedback?{" "}
              <a
                href="mailto:hello@tacitus.me"
                className="text-diplomatic-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
              >
                hello@tacitus.me
              </a>
            </p>
            {/* Social links */}
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://linkedin.com/company/tacitus-me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-400 transition-colors duration-200 hover:text-diplomatic-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
                aria-label="TACITUS on LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/tacitus_me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy-400 transition-colors duration-200 hover:text-diplomatic-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
                aria-label="TACITUS on X (Twitter)"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-overline text-navy-900 mb-4">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-navy-500 transition-colors duration-200 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-gold-600/15 bg-gold-600/4 px-8 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-serif text-base font-medium text-navy-900">
              Ready to upgrade your analytical workflow?
            </p>
            <p className="mt-1 text-sm text-navy-500">
              Full access · 5,000 credits on signup · Demo available instantly
            </p>
          </div>
          <a
            href="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-gold-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-gold-500 hover:shadow-lg hover:shadow-gold-600/20 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          >
            Access PRAXIS
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        {/* Built on */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-cream-300/60 pt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-navy-400">
            Built on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["Gemini AI", "Google Cloud Run", "Vertex AI", "ACLED", "GDELT"].map((name) => (
              <span
                key={name}
                className="text-xs font-semibold uppercase tracking-wider text-navy-300/60"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-center gap-4 border-t border-cream-300/60 pt-8 md:flex-row md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-navy-400">
              2026 TACITUS. All rights reserved. Built in New York.
            </p>
            <p className="text-xs text-navy-400/70">
              Built by a former UN Political Affairs Officer with 8 years on the Syria desk.
            </p>
          </div>

          {/* Security badges + version */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-diplomatic-blue/30 bg-diplomatic-blue/5 px-3 py-1 text-[10px] font-semibold text-diplomatic-blue">
              PRAXIS v6.3.1
            </span>
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              SOC 2 (Planned)
            </span>
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              AES-256 Encrypted
            </span>
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              GDPR (In Progress)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

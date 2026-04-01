import Link from "next/link";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Report Studio", href: "#tools" },
      { label: "PRAXIS Assistant", href: "#tools" },
      { label: "Conflict Graph", href: "#tools" },
      { label: "Media Compass", href: "#tools" },
      { label: "Calendar Monitor", href: "#tools" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Talking Points", href: "#tools" },
      { label: "Stakeholder Mapper", href: "#tools" },
      { label: "Early Warning", href: "#tools" },
      { label: "Sanctions Tracker", href: "#tools" },
      { label: "Document Vault", href: "#tools" },
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
            <Link href="/" className="inline-block">
              <span className="font-serif text-xl font-semibold tracking-wide text-diplomatic-blue">
                TACITUS
              </span>
            </Link>
            <p className="mt-3 text-sm text-navy-500 leading-relaxed">
              PRAXIS by TACITUS — Diplomacy. Evolved.
            </p>
            <p className="mt-1 text-xs text-navy-400">
              The missing tool for peace and diplomacy professionals.
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
                className="text-diplomatic-blue hover:underline"
              >
                hello@tacitus.me
              </a>
            </p>
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
                      className="text-sm text-navy-500 transition-colors duration-200 hover:text-navy-700"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Built on */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-cream-300/60 pt-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-navy-400">
            Built on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["Gemini AI", "Vercel", "Neo4j"].map((name) => (
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
              PRAXIS v5.0.0
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

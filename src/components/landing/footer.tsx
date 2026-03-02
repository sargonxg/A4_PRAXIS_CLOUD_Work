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
      { label: "About TACITUS", href: "#" },
      { label: "Advisory Council", href: "#advisory" },
      { label: "Security", href: "#security" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Data Processing", href: "#" },
      { label: "Cookie Policy", href: "#" },
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
              The AI-native intelligence workspace for peace and security professionals.
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

        {/* Bottom */}
        <div className="mt-14 flex flex-col items-center gap-4 border-t border-cream-300/60 pt-8 md:flex-row md:justify-between">
          <p className="text-xs text-navy-400">
            &copy; 2026 TACITUS. All rights reserved. Built in New York.
          </p>

          {/* Security badges */}
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              SOC 2 Compliant
            </span>
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              AES-256 Encrypted
            </span>
            <span className="rounded-full border border-cream-300 bg-white px-3 py-1 text-[10px] font-medium text-navy-500">
              GDPR Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

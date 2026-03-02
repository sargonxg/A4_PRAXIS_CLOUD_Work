import Link from "next/link";

const footerLinks = [
  { label: "Platform", href: "#features" },
  { label: "About", href: "#conflict-grammar" },
  { label: "Contact", href: "#cta" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-navy-800/50 bg-navy-950 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo + tagline */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-block">
              <span className="font-serif text-xl font-normal uppercase tracking-[0.25em] text-gold-500">
                Tacitus
              </span>
            </Link>
            <p className="mt-2 text-xs text-navy-500">
              Built for the world&apos;s most consequential decisions
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-navy-400 transition-colors duration-200 hover:text-navy-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-navy-800/30 pt-6 text-center">
          <p className="text-xs text-navy-600">
            &copy; 2026 TACITUS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

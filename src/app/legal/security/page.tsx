import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security - PRAXIS by TACITUS",
  description:
    "Security posture and responsible-use guidance for the PRAXIS early-access platform.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-[#1a2744]">
            TACITUS
          </Link>
          <Link href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">Early-access security posture</p>
          <p className="mt-1 text-sm text-amber-700">
            PRAXIS is being hardened for institutional pilots. Do not enter classified,
            legally privileged, or mission-critical material unless TACITUS has confirmed
            a production security arrangement for your workspace.
          </p>
        </div>

        <h1 className="mb-2 font-serif text-4xl font-semibold text-gray-900">Security</h1>
        <p className="mb-12 text-sm text-gray-500">Last updated: May 2026 | Version: 0.2</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">
          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Platform Controls</h2>
            <p>
              PRAXIS uses authenticated application routes, owner-scoped workspace access,
              session cookies, CSP headers, and server-side API gates for protected
              functionality. Audit scripts in the repository check route coverage, provider
              isolation, context boundaries, owner scoping, and symbolic firewall coverage.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Data Handling</h2>
            <p>
              User and workspace context should be treated as private tenant data. The
              platform is designed to keep generated context, graph mutations, and memo
              outputs tied to provenance, confidence, and review state rather than silently
              promoting AI text into authoritative claims.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">AI Review Posture</h2>
            <p>
              AI-generated material is advisory. Synthesized claims require human review
              before they are treated as durable graph assertions or decision-product source
              material.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Responsible Disclosure</h2>
            <p>
              Report security concerns to{" "}
              <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">
                hello@tacitus.me
              </a>
              . Include the affected route, time observed, browser or client details, and
              reproduction steps when possible.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PRAXIS by TACITUS",
  description: "Privacy Policy for PRAXIS by TACITUS. Experimental demo platform — please read carefully.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal nav */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-[#1a2744]">
            TACITUS
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Demo disclaimer banner */}
        <div className="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            Experimental Platform — Important Notice
          </p>
          <p className="mt-1 text-sm text-amber-700">
            PRAXIS is currently in early demo mode. This Privacy Policy describes our
            intended data practices. As the platform evolves, this policy will be updated.
            This document does not constitute legal advice and should not be relied upon as
            a substitute for independent legal counsel.
          </p>
        </div>

        <h1 className="mb-2 font-serif text-4xl font-semibold text-gray-900">
          Privacy Policy
        </h1>
        <p className="mb-2 text-sm text-gray-500">
          Last updated: March 2026 &nbsp;|&nbsp; Version: 0.1 (Demo)
        </p>
        <p className="mb-12 text-sm text-gray-400 italic">
          This policy applies to the PRAXIS demo platform operated by TACITUS.
        </p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">1. About This Policy</h2>
            <p>
              This Privacy Policy explains how TACITUS (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
              &ldquo;our&rdquo;) collects, uses, and protects information in connection with
              the PRAXIS platform. PRAXIS is currently an <strong>experimental demo
              product</strong>. All features, data practices, and security measures described
              in this policy represent our current intentions and may change substantially as
              the product develops.
            </p>
            <p className="mt-3">
              By using PRAXIS, you acknowledge and accept the experimental nature of this
              platform and the limitations described in this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">2. Who We Are</h2>
            <p>
              TACITUS is the company behind PRAXIS. We can be reached at{" "}
              <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">hello@tacitus.me</a>.
              We do not yet have a formally registered EU data controller designation. GDPR
              compliance is planned as we scale — see Section 7.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">3. What Data We Collect</h2>
            <p>In demo mode, we may collect:</p>
            <ul className="mt-3 space-y-2 list-disc pl-6">
              <li><strong>Contact information:</strong> Email addresses you voluntarily provide when contacting us or joining the mailing list.</li>
              <li><strong>Usage data:</strong> Anonymised interactions with the platform interface (pages visited, features used) to understand how practitioners use the tool.</li>
              <li><strong>Feedback:</strong> Any written feedback you send to hello@tacitus.me or submit via in-product forms.</li>
              <li><strong>Technical data:</strong> Browser type, IP address, and device information collected automatically via standard web server logs and analytics tools.</li>
            </ul>
            <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
              <strong>Demo Warning:</strong> Please do not enter classified, confidential,
              or personally sensitive information into PRAXIS during the demo phase.
              The platform is not yet certified for handling sensitive data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">4. How We Use Your Data</h2>
            <p>We use collected data to:</p>
            <ul className="mt-3 space-y-2 list-disc pl-6">
              <li>Respond to feedback and enquiries sent to hello@tacitus.me</li>
              <li>Understand how practitioners interact with the demo and improve the platform</li>
              <li>Send product updates to those who join our mailing list (you can unsubscribe at any time)</li>
              <li>Maintain the security and stability of the platform</li>
            </ul>
            <p className="mt-3">
              We do not sell your data to third parties. We do not use your data for
              advertising. We do not profile users for automated decision-making.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">5. Data Retention</h2>
            <p>
              During the demo phase, data retention policies are not yet formally defined.
              We aim to retain data only as long as necessary for the purposes described above.
              If you wish to request deletion of any data associated with your email address,
              contact us at <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">hello@tacitus.me</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">6. Data Security</h2>
            <p>
              We implement reasonable technical measures to protect data, including encrypted
              data transmission (TLS) and access controls. However, as an early-stage demo
              platform, we cannot guarantee the security of data to enterprise standards.
            </p>
            <p className="mt-3">
              SOC 2 Type II certification and formal penetration testing are <strong>planned</strong>
              and have not yet been completed. Do not use PRAXIS in demo mode for sensitive,
              classified, or mission-critical workloads.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">7. GDPR & International Privacy</h2>
            <p>
              Full GDPR compliance is a planned feature. We intend to appoint a Data Protection
              Officer, establish lawful bases for processing under Article 6 GDPR, and implement
              Data Subject Access Request (DSAR) procedures prior to any commercial launch.
            </p>
            <p className="mt-3">
              In the interim, if you are based in the EU/EEA and have concerns about your data,
              please contact us at{" "}
              <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">hello@tacitus.me</a>{" "}
              and we will respond as promptly as possible.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">8. Third-Party Services</h2>
            <p>
              PRAXIS uses third-party infrastructure providers (including cloud hosting and
              analytics tools). These providers have their own privacy policies. We are working
              to formalise data processing agreements with all providers before commercial launch.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">9. Changes to This Policy</h2>
            <p>
              As PRAXIS evolves from demo to commercial product, this Privacy Policy will be
              updated substantially. We will notify mailing list subscribers of material changes.
              The current version number and date are shown at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">10. Contact</h2>
            <p>
              For any questions about this Privacy Policy or your data, contact us at:
            </p>
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="font-semibold text-gray-800">TACITUS</p>
              <p className="mt-1">Email: <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">hello@tacitus.me</a></p>
            </div>
          </section>

        </div>

        {/* Bottom disclaimer */}
        <div className="mt-16 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-xs text-gray-500">
            This Privacy Policy is provided for informational purposes regarding our demo
            platform. It does not constitute legal advice. PRAXIS is an experimental product
            and all policies are subject to change. For enquiries, write to{" "}
            <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">hello@tacitus.me</a>.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs">
            <Link href="/terms" className="text-[#1a2744] hover:underline">Terms of Service</Link>
            <Link href="/" className="text-gray-500 hover:underline">Back to PRAXIS</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

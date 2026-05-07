import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Retention - PRAXIS by TACITUS",
  description:
    "Data retention posture for PRAXIS early-access workspaces, demos, source material, generated outputs, and audit records.",
};

export default function DataRetentionPage() {
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
        <div className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-semibold text-blue-900">Retention policy in active development</p>
          <p className="mt-1 text-sm text-blue-800">
            PRAXIS retention controls are being finalized for production pilots. This page
            states the current early-access posture and will be updated as workspace-level
            retention controls are enabled.
          </p>
        </div>

        <h1 className="mb-2 font-serif text-4xl font-semibold text-gray-900">Data Retention</h1>
        <p className="mb-12 text-sm text-gray-500">Last updated: May 2026 | Version: 0.2</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700">
          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Demo Data</h2>
            <p>
              Public demo workspaces use demonstration material and should not contain user
              secrets, classified content, or personally sensitive data. Demo sessions may be
              reset or cleared without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Workspace Data</h2>
            <p>
              Early-access workspace records are retained while an account remains active so
              users can reopen cases, retrieve context, inspect graph changes, and export
              decision products. Deletion requests can be sent to TACITUS support.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Generated Outputs</h2>
            <p>
              Generated memos, tool runs, synthesized candidates, and audit records may be
              retained to preserve provenance, review history, cost accounting, and rollback
              evidence for the workspace.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900">Deletion Requests</h2>
            <p>
              To request deletion or export of early-access data, contact{" "}
              <a href="mailto:hello@tacitus.me" className="text-[#1a2744] underline">
                hello@tacitus.me
              </a>
              . Include the account email and the workspace or case name where possible.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

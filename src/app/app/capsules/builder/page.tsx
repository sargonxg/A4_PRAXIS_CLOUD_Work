import Link from 'next/link';

import { CapsuleBuilderWizard } from '@/components/capsules/CapsuleBuilderWizard';

export const dynamic = 'force-dynamic';

export default function CapsuleBuilderPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#24211b]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <nav className="flex items-center justify-between text-sm">
          <Link href="/app/capsules" className="font-medium text-[#5b5347] hover:text-[#24211b]">
            Capsules
          </Link>
          <Link href="/app" className="text-[#6f675c] hover:text-[#24211b]">
            Back to PRAXIS
          </Link>
        </nav>
        <section className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#786f62]">
            Capsule Builder
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[#24211b] md:text-5xl">
            Build a policy capsule without writing JSON.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5b5347]">
            Describe the job, choose sources and outputs, run a light eval, then publish a reusable context capsule for PRAXIS augmented generation.
          </p>
        </section>
        <CapsuleBuilderWizard />
      </div>
    </main>
  );
}

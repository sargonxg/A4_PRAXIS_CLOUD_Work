import Link from 'next/link';
import nextDynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const CapsuleBuilderWizard = nextDynamic(
  () => import('@/components/capsules/CapsuleBuilderWizard').then((module) => module.CapsuleBuilderWizard),
  { loading: () => <CapsuleBuilderLoadingSkeleton /> },
);

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

function CapsuleBuilderLoadingSkeleton() {
  return (
    <section className="grid gap-4" data-testid="capsule-builder-loading-skeleton">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </section>
  );
}

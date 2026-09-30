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
    <div className="mx-auto w-full max-w-5xl space-y-5 text-[var(--color-deep-ink)]">
      <Link href="/app/capsules" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Back to capsules</Link>
      <header>
        <h1 className="praxis-page-heading font-serif text-3xl font-semibold">Create a capsule</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-graphite)]">Save your sources, assumptions and working approach. Three steps, then reuse it in chat.</p>
      </header>
      <CapsuleBuilderWizard />
    </div>
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

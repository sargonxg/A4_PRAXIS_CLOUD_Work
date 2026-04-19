'use client';

/**
 * /app/situations/[id] — default landing page for a single situation.
 *
 * Today this is a thin client redirect to the Settings editor. Once a
 * dedicated situation overview / dashboard view is built it should replace
 * this redirect. Spec: ad-hoc — see src/app/app/situations/[id]/settings/page.tsx.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { Loader2 } from 'lucide-react';

export default function SituationLandingPage() {
  const params = useParams();
  const router = useRouter();
  const route = usePraxisRoute();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  useEffect(() => {
    if (!id) return;
    router.replace(route(`/situations/${id}/settings`));
  }, [id, router, route]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-navy-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening situation…
    </div>
  );
}

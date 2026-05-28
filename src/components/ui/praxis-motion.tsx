'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const PRAXIS_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function PraxisRouteTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={cn('min-w-0', className)}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: PRAXIS_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

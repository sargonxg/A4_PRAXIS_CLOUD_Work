'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'praxis-visited-pages';

/**
 * Reads the visited pages array from localStorage.
 */
function getVisitedPages(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Marks a page as visited in localStorage.
 */
export function markPageVisited(href: string): void {
  if (typeof window === 'undefined') return;
  try {
    const visited = getVisitedPages();
    if (!visited.includes(href)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited, href]));
    }
  } catch {
    // ignore storage errors
  }
}

interface UnvisitedDotProps {
  /** The href of the nav item this dot is attached to */
  href: string;
  /** Optional override — if you already know the visited state */
  visited?: boolean;
  className?: string;
}

/**
 * A small pulsing green dot shown next to unvisited nav items.
 * It self-hides once the page has been visited.
 */
export function UnvisitedDot({ href, visited: visitedProp, className }: UnvisitedDotProps) {
  const [visited, setVisited] = useState(true); // default to true to avoid flash

  useEffect(() => {
    // Resolve visited state from localStorage if not provided as a prop
    if (visitedProp !== undefined) {
      setVisited(visitedProp);
      return;
    }
    setVisited(getVisitedPages().includes(href));
  }, [href, visitedProp]);

  if (visited) return null;

  return (
    <span
      className={cn(
        'relative flex h-2 w-2 shrink-0',
        className
      )}
      aria-hidden="true"
    >
      {/* Ping animation */}
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      {/* Solid dot */}
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

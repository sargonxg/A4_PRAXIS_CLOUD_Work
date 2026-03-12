'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { WelcomeModal } from './welcome-modal';
import { GuidedWalkthrough } from './walkthrough';

const TOUR_SEEN_KEY = 'praxis-tour-seen';
const VISITED_PAGES_KEY = 'praxis-visited-pages';

export function OnboardingWrapper() {
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run after hydration to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const seen = localStorage.getItem(TOUR_SEEN_KEY);
      if (!seen) {
        setShowWelcome(true);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
  }, []);

  // Track visited pages
  useEffect(() => {
    if (!mounted) return;
    try {
      const raw = localStorage.getItem(VISITED_PAGES_KEY);
      const visited: string[] = raw ? JSON.parse(raw) : [];
      if (!visited.includes(pathname)) {
        localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify([...visited, pathname]));
      }
    } catch {
      // ignore
    }
  }, [pathname, mounted]);

  function handleStartTour() {
    setShowWelcome(false);
    setTourActive(true);
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function handleExploreFree() {
    setShowWelcome(false);
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
  }

  function handleTourComplete() {
    setTourActive(false);
  }

  // Don't render anything until after client hydration
  if (!mounted) return null;

  return (
    <>
      {showWelcome && (
        <WelcomeModal onStartTour={handleStartTour} onExploreFree={handleExploreFree} />
      )}
      {tourActive && <GuidedWalkthrough onComplete={handleTourComplete} />}
    </>
  );
}

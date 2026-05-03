'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { WelcomeModal } from './welcome-modal';
import { GuidedWalkthrough } from './walkthrough';

const TOUR_SEEN_KEY = 'praxis-tour-seen';
const VISITED_PAGES_KEY = 'praxis-visited-pages';

export function OnboardingWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  // Only run after hydration to avoid SSR mismatch
  useEffect(() => {
    let shouldShow = false;
    try {
      if (searchParams.get('recording') === '1' && searchParams.get('case') === 'syria') {
        localStorage.setItem(TOUR_SEEN_KEY, 'true');
        shouldShow = false;
      } else {
        const seen = localStorage.getItem(TOUR_SEEN_KEY);
        shouldShow = !seen;
      }
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
    const timer = window.setTimeout(() => setShowWelcome(shouldShow), 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  // Track visited pages
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITED_PAGES_KEY);
      const visited: string[] = raw ? JSON.parse(raw) : [];
      if (!visited.includes(pathname)) {
        localStorage.setItem(VISITED_PAGES_KEY, JSON.stringify([...visited, pathname]));
      }
    } catch {
      // ignore
    }
  }, [pathname]);

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

  return (
    <>
      {showWelcome && (
        <WelcomeModal onStartTour={handleStartTour} onExploreFree={handleExploreFree} />
      )}
      {tourActive && <GuidedWalkthrough onComplete={handleTourComplete} />}
    </>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";

function subscribeStaticOverride() {
  return () => undefined;
}

function getStaticOverrideSnapshot() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("staticHero") === "1" ||
    window.localStorage.getItem("praxis_static") === "1" ||
    process.env.NEXT_PUBLIC_PRAXIS_FORCE_REDUCED_MOTION === "1"
  );
}

export function useNarrativeMotion() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const staticOverride = useSyncExternalStore(
    subscribeStaticOverride,
    getStaticOverrideSnapshot,
    () => false,
  );

  return !shouldReduceMotion && !staticOverride;
}

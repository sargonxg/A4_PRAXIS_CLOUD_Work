"use client";

import { useState } from "react";
import { ProductGlimpse } from "./hero";

/**
 * Hero visual slot.
 *
 * If /landing/hero-loop.mp4 is present, plays it muted on loop.
 * If the file is absent or the element errors, falls back to the static
 * ProductGlimpse animation so the above-the-fold layout never collapses.
 * Search engines and no-JS visitors see ProductGlimpse via the <noscript>.
 *
 * To enable the video: drop a 30-45s 1280×800-ish silent screen capture at
 * public/landing/hero-loop.mp4 and redeploy. No code change required.
 */
export function HeroVisual() {
  const [videoFailed, setVideoFailed] = useState(false);

  if (videoFailed) {
    return <ProductGlimpse />;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="relative w-full overflow-hidden rounded-2xl border border-diplomatic-blue/12 bg-white/70 shadow-xl shadow-navy-950/5 backdrop-blur-sm"
      >
        <video
          autoPlay
          muted
          playsInline
          loop
          preload="metadata"
          onError={() => setVideoFailed(true)}
          poster="/landing/hero-loop.jpg"
          className="block aspect-[16/10] w-full object-cover"
        >
          <source src="/landing/hero-loop.mp4" type="video/mp4" />
        </video>
      </div>
      <noscript>
        <div className="relative w-full">
          {/* No-JS fallback — rendered statically at SSR time. */}
          <ProductGlimpse />
        </div>
      </noscript>
    </>
  );
}

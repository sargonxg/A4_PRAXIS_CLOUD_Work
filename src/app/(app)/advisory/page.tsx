'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { advisors, type Advisor } from '@/lib/constants/advisors';

function AdvisorCard({ advisor }: { advisor: Advisor }) {
  return (
    <Link
      href={`/advisory/${advisor.id}`}
      className="group rounded-xl border border-navy-700/50 bg-navy-800 p-6 transition-all hover:border-navy-600 hover:shadow-lg hover:shadow-navy-950/50"
    >
      {/* Avatar */}
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full font-serif text-lg font-semibold"
          style={{
            backgroundColor: `${advisor.color}15`,
            color: advisor.color,
            border: `2px solid ${advisor.color}40`,
          }}
        >
          {advisor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h3 className="text-base font-semibold text-navy-50">{advisor.name}</h3>
          <p className="text-xs font-medium" style={{ color: advisor.color }}>{advisor.title}</p>
        </div>
      </div>

      {/* Tagline */}
      <p className="mb-4 text-sm italic text-navy-300 leading-relaxed">
        &ldquo;{advisor.tagline}&rdquo;
      </p>

      {/* Bio */}
      <p className="mb-4 text-xs text-navy-400 leading-relaxed">
        {advisor.bio}
      </p>

      {/* Expertise */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {advisor.expertise.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-navy-700/40 px-2.5 py-0.5 text-[10px] font-medium text-navy-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-navy-700/50 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-sage">
          <div className="h-2 w-2 rounded-full bg-sage animate-pulse" />
          Online
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-gold-400 opacity-0 transition-opacity group-hover:opacity-100">
          Consult <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

export default function AdvisoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold-400" />
          <h1 className="text-2xl font-semibold text-navy-50">Advisory Council</h1>
        </div>
        <p className="mt-1 text-sm text-navy-400">
          AI experts with decades of specialized experience. Ask them anything.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.id} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkOnThisMenuProps {
  itemLabel: string;
  askHref?: string;
  contextHref?: string;
  draftHref?: string;
  sourcesHref?: string;
  risksHref?: string;
  handoverHref?: string;
}

export function WorkOnThisMenu({
  itemLabel,
  askHref = '/app/assistant',
  contextHref = '/app/dashboard',
  draftHref = '/app/write',
  sourcesHref = '/app/contexts',
  risksHref = '/app/tools',
  handoverHref = '/app/write',
}: WorkOnThisMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50"
          aria-label={`Work on ${itemLabel}`}
        >
          Work on this
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <MenuLink href={askHref}>Ask PRAXIS about it</MenuLink>
        <MenuLink href={contextHref}>Add to active context</MenuLink>
        <MenuLink href={draftHref}>Draft from it</MenuLink>
        <MenuLink href={sourcesHref}>Find sources</MenuLink>
        <MenuLink href={risksHref}>Review risks</MenuLink>
        <MenuLink href={handoverHref}>Create handover note</MenuLink>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <DropdownMenuItem asChild>
      <Link href={href}>{children}</Link>
    </DropdownMenuItem>
  );
}

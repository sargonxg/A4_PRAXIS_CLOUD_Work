'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FolderKanban, MessageSquareText, MoreHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from '@/lib/navigation/primary-nav';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const secondary = NAV_GROUPS.find((group) => group.id === 'advanced')?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); moreRef.current?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  return (
    <nav ref={rootRef} className="praxis-mobile-navigation fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden" aria-label="Primary mobile navigation" data-testid="mobile-bottom-nav">
      {open ? <div id="mobile-more-destinations" className="absolute bottom-full right-3 mb-2 grid w-[min(18rem,calc(100vw-1.5rem))] gap-1 rounded-xl border border-[var(--color-app-border)] bg-white p-2 shadow-[var(--shadow-float)]" aria-label="More workspace tools">{secondary.map((item) => <Link key={item.id} href={item.href} className="praxis-nav-link" onClick={() => setOpen(false)}>{item.label}</Link>)}<Link href="/guide" className="praxis-nav-link" onClick={() => setOpen(false)}>Quick start</Link></div> : null}
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-1">
        <Link href="/app" aria-current={pathname === '/app' || pathname.startsWith('/app/conversations/') ? 'page' : undefined} className="praxis-mobile-nav-link" onClick={() => setOpen(false)}><MessageSquareText className="h-5 w-5" />Chat</Link>
        <Link href="/app/capsules" aria-current={pathname.startsWith('/app/capsules') ? 'page' : undefined} className="praxis-mobile-nav-link" onClick={() => setOpen(false)}><FolderKanban className="h-5 w-5" />Capsules</Link>
        <button ref={moreRef} type="button" className="praxis-mobile-nav-link" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-more-destinations"><MoreHorizontal className="h-5 w-5" />More</button>
      </div>
    </nav>
  );
}

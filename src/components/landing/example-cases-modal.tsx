"use client";

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ExampleCasesGallery } from '@/components/landing/example-cases-gallery';

type ExampleCasesModalProps = {
  triggerClassName?: string;
};

export function ExampleCasesModal({ triggerClassName }: ExampleCasesModalProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const firstLink = dialogRef.current?.querySelector<HTMLAnchorElement>('a[href]');
    firstLink?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Try an example case
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/50 px-4 py-6 backdrop-blur-sm sm:py-10" role="presentation" onMouseDown={close}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="example-cases-modal-heading"
            aria-describedby="example-cases-modal-description"
            className="relative w-full max-w-5xl rounded-lg bg-slate-50 p-5 text-navy-950 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-navy-500 transition hover:text-navy-950"
              aria-label="Close example cases"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="pr-12">
              <h2 id="example-cases-modal-heading" className="font-serif text-2xl font-semibold text-navy-950">
                Six example cases - open a guest session
              </h2>
              <p id="example-cases-modal-description" className="mt-2 text-sm leading-6 text-navy-600">
                Shipped cases open immediately. Planned cases stay visible so the product story is not mistaken for one geography.
              </p>
            </div>
            <div className="mt-5">
              <ExampleCasesGallery compact />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

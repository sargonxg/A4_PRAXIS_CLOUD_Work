import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — PRAXIS Demo',
    default: 'PRAXIS Demo',
  },
  robots: 'noindex, nofollow',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Negotiation Prep',
  description: 'Analyze zones of possible agreement, BATNAs, and negotiation dynamics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

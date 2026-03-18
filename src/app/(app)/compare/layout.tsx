import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare',
  description: 'Cross-conflict comparison and pattern analysis.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

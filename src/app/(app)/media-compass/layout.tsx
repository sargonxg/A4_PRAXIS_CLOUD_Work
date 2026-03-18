import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Media Compass',
  description: 'Analyze media sources for bias, reliability, and conflict coverage quality.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

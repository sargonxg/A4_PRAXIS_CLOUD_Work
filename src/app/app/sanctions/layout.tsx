import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sanctions',
  description: 'Check sanctions regimes and compliance across conflict actors.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

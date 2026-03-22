import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Actor Profiles | PRAXIS by TACITUS',
  description: 'Actor intelligence registry with comprehensive dossiers and leverage analysis.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

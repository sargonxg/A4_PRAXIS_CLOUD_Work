import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conflict Graph',
  description: 'Interactive knowledge graph visualization of conflict actors, relationships, and dynamics.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

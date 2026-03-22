import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ARGUS Intelligence | PRAXIS by TACITUS',
  description: 'Graph-augmented RAG intelligence for conflict analysis — knowledge graph queries, document entity extraction, and cross-case pattern matching.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

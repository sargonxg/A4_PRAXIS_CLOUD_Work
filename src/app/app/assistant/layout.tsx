import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'Chat with PRAXIS AI for conflict analysis, research, and intelligence gathering.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'PRAXIS command center for cases, graph context, marketplace tools, memos, boardroom, and SAT workflows.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

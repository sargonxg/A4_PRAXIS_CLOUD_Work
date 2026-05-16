import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'PRAXIS command center for situations, context, tools, memos, canvas, and agent runs.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

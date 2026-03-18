import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'Track conflict-related events, deadlines, and diplomatic milestones.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Create and manage intelligence reports using UN-standard templates.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

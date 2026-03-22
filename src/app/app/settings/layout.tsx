import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure PRAXIS workspace and AI provider settings.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

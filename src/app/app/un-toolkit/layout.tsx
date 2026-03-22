import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UN Toolkit',
  description: 'UN terminology checker, resolution drafter, and diplomatic style tools.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

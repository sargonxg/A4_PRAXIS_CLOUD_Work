import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advisory Council',
  description: 'Consult AI-powered expert advisors across conflict analysis disciplines.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talking Points',
  description: 'Generate structured diplomatic talking points for briefings and presentations.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

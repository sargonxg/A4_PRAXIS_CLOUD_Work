import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents',
  description: 'Upload and analyze conflict-related documents with AI entity extraction.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenario Analysis',
  description: 'Model conflict scenarios across political, security, and humanitarian dimensions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

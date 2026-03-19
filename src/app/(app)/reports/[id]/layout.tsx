import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report | PRAXIS by TACITUS',
  description: 'View and edit an intelligence report with AI-assisted drafting and UN-standard formatting.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dossier Generator | PRAXIS by TACITUS',
  description: 'Generate comprehensive AI intelligence dossiers with animated progress — showcasing PRAXIS + ARGUS analytical capabilities.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CONCORDIA Mediation | PRAXIS by TACITUS',
  description: 'AI-assisted mediation guidance — session planning, live mediation assistant, and settlement generation.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

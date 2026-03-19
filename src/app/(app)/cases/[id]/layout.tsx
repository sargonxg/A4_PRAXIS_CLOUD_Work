import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case | PRAXIS by TACITUS',
  description: 'Detailed conflict case analysis using the ACO Conflict Grammar ontology with actors, claims, events, and structured intelligence.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cases',
  description: 'Manage and analyze conflict cases with structured Conflict Grammar ontology.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

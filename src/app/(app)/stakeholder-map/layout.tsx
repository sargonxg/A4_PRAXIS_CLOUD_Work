import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stakeholder Map',
  description: 'Map and analyze conflict stakeholders, interests, and relationships.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

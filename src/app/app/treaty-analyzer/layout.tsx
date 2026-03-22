import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treaty & Agreement Analyzer | PRAXIS by TACITUS',
  description: 'Analyze treaty clauses, track compliance, and detect ambiguities in conflict agreements.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

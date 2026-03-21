import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Monitor | PRAXIS by TACITUS',
  description: 'Risk heatmap and conflict forecasting across monitored regions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Early Warning',
  description: 'Monitor escalation indicators and early warning signals across conflicts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

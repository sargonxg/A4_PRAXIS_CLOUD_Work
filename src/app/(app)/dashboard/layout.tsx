import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Real-time conflict intelligence dashboard with alerts, cases, and AI-powered insights.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

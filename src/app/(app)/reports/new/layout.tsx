import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Report | PRAXIS by TACITUS',
  description: 'Create a new intelligence report using UN-standard templates for Security Council briefings, SG reports, and diplomatic assessments.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Briefing Room | PRAXIS by TACITUS',
  description:
    'Generate and deliver structured intelligence briefings for leadership and stakeholders.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

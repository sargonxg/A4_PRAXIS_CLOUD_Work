import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your PRAXIS workspace to continue your questions, sources, and saved work.',
  alternates: { canonical: '/login' },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

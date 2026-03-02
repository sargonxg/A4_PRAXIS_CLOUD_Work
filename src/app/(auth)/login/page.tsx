'use client';

import { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Shield, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('analyst@tacitus.demo');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(signInEmail?: string) {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail || email }),
      });

      const data = await res.json();

      if (data.success) {
        startTransition(() => {
          router.push(redirect);
          router.refresh();
        });
      } else {
        setError('Authentication failed. Please try again.');
        setIsLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    await handleSignIn(email);
  }

  async function handleDemoMode() {
    await handleSignIn('analyst@tacitus.demo');
  }

  const loading = isLoading || isPending;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy-950 px-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-gold-500) 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-navy-700/50 bg-navy-900/80 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          {/* Logo area */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-gold-500/20 bg-gold-500/10">
              <Shield className="h-7 w-7 text-gold-500" />
            </div>
            <h1 className="font-serif text-3xl tracking-wide text-gold-500">
              TACITUS
            </h1>
            <p className="mt-1.5 text-sm tracking-widest text-navy-400 uppercase">
              Diplomatic Intelligence Platform
            </p>
          </motion.div>

          {/* Login form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium tracking-wide text-navy-300 uppercase"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="your.name@organization.gov"
                disabled={loading}
                className={cn(
                  'w-full rounded-lg border bg-navy-950/60 px-4 py-3 text-sm text-navy-100',
                  'placeholder:text-navy-600',
                  'transition-colors duration-200',
                  'focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 focus:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error
                    ? 'border-crimson/50'
                    : 'border-navy-700/60 hover:border-navy-600'
                )}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-crimson"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3',
                'bg-gold-500 text-navy-950 font-semibold text-sm',
                'transition-all duration-200',
                'hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="my-6 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-navy-700/50" />
            <span className="text-xs tracking-wider text-navy-500 uppercase">
              or
            </span>
            <div className="h-px flex-1 bg-navy-700/50" />
          </motion.div>

          {/* Demo mode button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={handleDemoMode}
              disabled={loading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3',
                'border border-navy-600/60 bg-transparent text-sm font-medium text-navy-200',
                'transition-all duration-200',
                'hover:border-gold-500/30 hover:bg-navy-800/50 hover:text-gold-400',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Enter Demo Mode
                </>
              )}
            </button>
          </motion.div>

          {/* Access request link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 text-center text-xs text-navy-500"
          >
            Need access?{' '}
            <a
              href="#"
              className="text-gold-500/80 transition-colors hover:text-gold-400 hover:underline"
            >
              Request access for your organization
            </a>
          </motion.p>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 text-center text-xs text-navy-600"
        >
          Secured by TACITUS Intelligence Systems
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-navy-950">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

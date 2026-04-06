'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Shield, ArrowRight, Loader2, Mail, Chrome } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-crimson' };
  if (score <= 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 60, label: 'Good', color: 'bg-amber-500' };
  if (score <= 4) return { score: 80, label: 'Strong', color: 'bg-emerald-400' };
  return { score: 100, label: 'Excellent', color: 'bg-emerald-500' };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMode = searchParams.get('mode');
  const rawRedirect = searchParams.get('redirect');
  const planParam = searchParams.get('plan'); // e.g. ?plan=analyst from pricing page
  const appRedirect = planParam
    ? `/app/settings?upgrade=${planParam}` // Send to settings with upgrade prompt
    : rawRedirect?.startsWith('/app') ? rawRedirect : '/app/dashboard';
  const demoRedirect = rawRedirect?.startsWith('/demo') ? rawRedirect : '/demo/dashboard';
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemo, resetPassword } = useAuth();

  // Guard: prevents double-navigation when both handleEmailSubmit and this
  // useEffect are triggered for the same sign-in event.
  const didNavigate = useRef(false);

  // Handles Google redirect return AND already-logged-in users visiting /login.
  // For email/password, handleEmailSubmit sets didNavigate first so this is a no-op.
  useEffect(() => {
    if (loading || didNavigate.current) return;

    // Already logged-in real user → redirect to app
    if (user && !user.isDemo) {
      didNavigate.current = true;
      router.push(appRedirect);
      return;
    }

    // Already logged-in demo user → redirect to demo
    if (user && user.isDemo) {
      didNavigate.current = true;
      router.push(demoRedirect);
      return;
    }
  }, [user, loading, router, appRedirect, demoRedirect]);

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(
    queryMode === 'signup' ? 'signup' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      let result;
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setIsLoading(false);
          return;
        }
        result = await signUpWithEmail(email, password, name);
      } else {
        result = await signInWithEmail(email, password);
      }

      if (result.success) {
        // Navigate immediately — cookie is already set by signInWithEmail/signUpWithEmail.
        // Mark didNavigate so the useEffect below doesn't double-push when
        // onAuthStateChanged later fires and sets loading=false.
        didNavigate.current = true;
        router.push(appRedirect);
      } else {
        setError(result.error || 'Authentication failed.');
        setIsLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      // signInWithRedirect navigates the page away to Google — success/failure is handled
      // on return via onAuthStateChanged → useEffect auto-redirect above.
      // Only handle explicit pre-redirect errors here (e.g. auth/unauthorized-domain).
      if (!result.success) {
        setError(result.error || 'Google sign-in failed.');
        setIsLoading(false);
      }
      // On success: page is navigating away — no further action needed
    } catch {
      setError('Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccessMsg('If an account exists for that email, a reset link has been sent. Check your inbox.');
      } else {
        setError(result.error || 'Failed to send reset email.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDemoMode() {
    setIsLoading(true);
    await signInAsDemo();
    // Small delay to ensure cookie is set before navigation
    await new Promise((r) => setTimeout(r, 100));
    router.push(demoRedirect);
  }

  // Auto-enter demo mode when redirected from middleware with ?mode=demo
  const demoAutoEntered = useRef(false);
  useEffect(() => {
    if (queryMode === 'demo' && !loading && !user && !demoAutoEntered.current) {
      demoAutoEntered.current = true;
      handleDemoMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMode, loading, user]);

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
            <p className="mt-3 text-[11px] text-navy-500">
              Trusted by analysts at UN, OSCE, and leading think tanks
            </p>
          </motion.div>

          {/* Google Sign In */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={cn(
                'group flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3',
                'border border-navy-600/60 bg-white/5 text-sm font-medium text-navy-100',
                'transition-all duration-200',
                'hover:bg-white/10 hover:border-navy-500',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Chrome className="h-5 w-5 text-navy-300" />
                  Continue with Google
                </>
              )}
            </button>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="my-5 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-navy-700/50" />
            <span className="text-xs tracking-wider text-navy-500 uppercase">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-navy-700/50" />
          </motion.div>

          {/* Email/Password form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            onSubmit={mode === 'reset' ? handleResetPassword : handleEmailSubmit}
            className="space-y-3.5"
          >
            {mode === 'reset' && (
              <p className="text-xs text-navy-400">
                Enter your email and we&apos;ll send a password reset link.
              </p>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-medium tracking-wide text-navy-300 uppercase"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  placeholder="Dr. Jane Smith"
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-lg border bg-navy-950/60 px-4 py-3 text-sm text-navy-100',
                    'placeholder:text-navy-600',
                    'transition-colors duration-200',
                    'focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'border-navy-700/60 hover:border-navy-600'
                  )}
                />
              </div>
            )}

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
                onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
                placeholder="your.name@organization.gov"
                disabled={isLoading}
                className={cn(
                  'w-full rounded-lg border bg-navy-950/60 px-4 py-3 text-sm text-navy-100',
                  'placeholder:text-navy-600',
                  'transition-colors duration-200',
                  'focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 focus:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error ? 'border-crimson/50' : 'border-navy-700/60 hover:border-navy-600'
                )}
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium tracking-wide text-navy-300 uppercase"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-navy-500 hover:text-gold-500/80 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  disabled={isLoading}
                  className={cn(
                    'w-full rounded-lg border bg-navy-950/60 px-4 py-3 text-sm text-navy-100',
                    'placeholder:text-navy-600',
                    'transition-colors duration-200',
                    'focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error ? 'border-crimson/50' : 'border-navy-700/60 hover:border-navy-600'
                  )}
                />
                {mode === 'signup' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-navy-800">
                        <div
                          className={cn('h-full rounded-full transition-all duration-300', passwordStrength.color)}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-navy-400 w-16 text-right">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-crimson"
              >
                {error}
              </motion.p>
            )}

            {successMsg && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs text-emerald-400"
              >
                {successMsg}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3',
                'bg-gold-500 text-navy-950 font-semibold text-sm',
                'transition-all duration-200',
                'hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  {mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Link' : 'Sign In'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Toggle sign in / sign up / reset */}
            <p className="text-center text-xs text-navy-500">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                    className="text-gold-500/80 hover:text-gold-400 hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : mode === 'reset' ? (
                <>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    className="text-gold-500/80 hover:text-gold-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    className="text-gold-500/80 hover:text-gold-400 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="my-5 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-navy-700/50" />
            <span className="text-xs tracking-wider text-navy-500 uppercase">
              or explore without an account
            </span>
            <div className="h-px flex-1 bg-navy-700/50" />
          </motion.div>

          {/* Demo mode button — prominent, gold-accented */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={handleDemoMode}
              disabled={isLoading}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5',
                'border border-gold-500/30 bg-gold-500/5 text-sm font-semibold text-gold-400',
                'transition-all duration-200',
                'hover:border-gold-500/50 hover:bg-gold-500/10 hover:text-gold-300',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Try the Demo — No Account Needed
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-navy-500">
              Full platform with pre-loaded Nordalia crisis data. Explore all 40+ tools instantly.
            </p>
          </motion.div>

          {/* Credits info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
          >
            <p className="text-center text-xs text-emerald-400">
              <span className="font-semibold">5,000 TACITUS Credits</span> awarded on sign-up — power your AI analysis
            </p>
          </motion.div>
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

'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { ArrowRight, Loader2, Mail, Chrome, Paperclip, Upload, Monitor, Mic } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect';
import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip';
import {
  PENDING_POLICY_AGENT_ID_KEY,
  PENDING_TASKLET_PROMPT_KEY,
} from '@/lib/product/policy-agents';
import {
  PENDING_CONTEXT_CAPSULE_OUTPUT_KEY,
  PENDING_CONTEXT_CAPSULE_PATH_KEY,
  PENDING_CONTEXT_CAPSULE_PROMPT_KEY,
  PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY,
} from '@/lib/product/context-capsules';

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
  const planParam = searchParams.get('plan'); // e.g. ?plan=analyst from billing or invite links
  const capsulePromptParam = searchParams.get('capsulePrompt');
  const capsuleTemplateParam = searchParams.get('capsuleTemplate');
  const capsulePathParam = searchParams.get('capsulePath');
  const capsuleOutputParam = searchParams.get('capsuleOutput');
  const policyAgentParam = searchParams.get('policyAgentId');
  const appRedirect = planParam
    ? `/pricing?upgrade=${planParam}`
    : resolvePostLoginRedirect(searchParams, false);
  const {
    user,
    loading,
    authError,
    clearAuthError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
  } = useAuth();

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

    // Already logged-in demo sessions are legacy-only; do not expose a new
    // demo entry from /login.
    if (user && user.isDemo) {
      didNavigate.current = true;
      router.push('/app');
      return;
    }
  }, [user, loading, router, appRedirect]);

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

  useEffect(() => {
    const prompt = capsulePromptParam?.trim();
    if (prompt) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY, prompt);
      window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, prompt);
    }
    if (capsuleTemplateParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY, capsuleTemplateParam);
    }
    if (capsulePathParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PATH_KEY, capsulePathParam);
    }
    if (capsuleOutputParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY, capsuleOutputParam);
    }
    if (policyAgentParam) {
      window.localStorage.setItem(PENDING_POLICY_AGENT_ID_KEY, policyAgentParam);
    }
  }, [capsulePromptParam, capsuleTemplateParam, capsulePathParam, capsuleOutputParam, policyAgentParam]);

  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [authError]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address.');
      clearAuthError();
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password.');
      clearAuthError();
      return;
    }

    setError('');
    clearAuthError();
    setIsLoading(true);

    try {
      let result;
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          clearAuthError();
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
    clearAuthError();
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
      clearAuthError();
      return;
    }
    setError('');
    clearAuthError();
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

  return (
    <div className="min-h-screen bg-[color:var(--color-app-bg)] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.72fr)]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-[color:var(--color-app-bg)] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative flex min-h-screen flex-col p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <PraxisBrandChip subtitle="Private ContextCapsule workspace" />
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                praxis.tacitus.me/app
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-10">
              <p className="text-center text-sm font-medium text-slate-500">Same cockpit before and after sign-in</p>
              <h1 className="mx-auto mt-6 max-w-3xl text-center font-serif text-5xl font-semibold tracking-tight text-slate-950">
                What can PRAXIS do for you?
              </h1>
              <div className="mx-auto mt-8 w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
                <p className="px-1 py-2 text-xl text-slate-400">Describe a task or responsibility</p>
                <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    {[Paperclip, Upload, Monitor].map((Icon, index) => (
                      <span key={index} className="rounded-md border border-slate-200 p-2">
                        <Icon className="h-4 w-4" />
                      </span>
                    ))}
                  </div>
                  <span className="rounded-md p-2 text-slate-600">
                    <Mic className="h-4 w-4" />
                  </span>
                </div>
              </div>
              <div className="mx-auto mt-8 flex max-w-3xl justify-center gap-10 border-b border-slate-200 text-sm font-semibold text-slate-400">
                {['Analysis', 'Monitoring', 'Review', 'Context'].map((tab, index) => (
                  <span
                    key={tab}
                    className={cn(
                      'pb-3',
                      index === 0
                        ? 'border-b-2 border-[color:var(--color-rose-gold)] text-[color:var(--color-rose-gold)]'
                        : '',
                    )}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.42) 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 backdrop-blur-sm sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-6 text-center"
          >
            <PraxisBrandChip subtitle="Think Policy" className="mb-4 justify-center" />
            <h1 className="font-serif text-3xl tracking-wide text-slate-950">
              PRAXIS
            </h1>
            <p className="mt-1.5 text-xs font-semibold tracking-[0.24em] text-[color:var(--color-rose-gold)] uppercase">
              PRAXIS | Think Policy
            </p>
            <p className="mt-2 text-sm tracking-widest text-slate-500 uppercase">
              Open the app workspace
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
                'border border-slate-200 bg-white text-sm font-medium text-slate-800 shadow-sm',
                'transition-all duration-200',
                'hover:border-slate-300 hover:bg-slate-50',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Chrome className="h-5 w-5 text-slate-500" />
                  Continue with Google
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              Uses secure Google sign-in in this tab. Choose the account you want tied to PRAXIS.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="my-5 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs tracking-wider text-slate-400 uppercase">
              or email
            </span>
            <div className="h-px flex-1 bg-slate-200" />
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
              <p className="text-xs text-slate-500">
                Enter your email and we&apos;ll send a password reset link.
              </p>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase"
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
                    'w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-950',
                    'placeholder:text-slate-400',
                    'transition-colors duration-200',
                    'focus:border-[color:var(--color-rose-gold)] focus:ring-1 focus:ring-[color:var(--color-rose-gold)]/30 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'border-slate-200 hover:border-slate-300'
                  )}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium tracking-wide text-slate-500 uppercase"
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
                  'w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-950',
                  'placeholder:text-slate-400',
                  'transition-colors duration-200',
                  'focus:border-[color:var(--color-rose-gold)] focus:ring-1 focus:ring-[color:var(--color-rose-gold)]/30 focus:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  error ? 'border-crimson/50' : 'border-slate-200 hover:border-slate-300'
                )}
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium tracking-wide text-slate-500 uppercase"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-slate-500 hover:text-[color:var(--color-rose-gold)] hover:underline"
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
                    'w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-950',
                    'placeholder:text-slate-400',
                    'transition-colors duration-200',
                    'focus:border-[color:var(--color-rose-gold)] focus:ring-1 focus:ring-[color:var(--color-rose-gold)]/30 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    error ? 'border-crimson/50' : 'border-slate-200 hover:border-slate-300'
                  )}
                />
                {mode === 'signup' && password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full transition-all duration-300', passwordStrength.color)}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 w-16 text-right">
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
                className="text-xs text-emerald-600"
              >
                {successMsg}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3',
                'bg-slate-950 text-white font-semibold text-sm',
                'transition-all duration-200',
                'hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-300/60',
                'active:scale-[0.98]',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  {mode === 'signup' ? 'Create PRAXIS workspace' : mode === 'reset' ? 'Send Reset Link' : 'Open PRAXIS'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {/* Toggle sign in / sign up / reset */}
            <p className="text-center text-xs text-slate-500">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                    className="font-semibold text-[color:var(--color-rose-gold)] hover:underline"
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
                    className="font-semibold text-[color:var(--color-rose-gold)] hover:underline"
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
                    className="font-semibold text-[color:var(--color-rose-gold)] hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-5 rounded-lg border border-slate-200 bg-[color:var(--color-app-bg)] px-4 py-3"
          >
            <p className="text-center text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Free workspace</span> includes capsules, source receipts, policy agents, and memo tools.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 text-center text-xs text-slate-500"
        >
          Secured by TACITUS Intelligence Systems
        </motion.p>
      </motion.div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-app-bg)]">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-rose-gold)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

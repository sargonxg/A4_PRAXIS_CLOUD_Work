'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Mail, Chrome } from 'lucide-react';
import Link from 'next/link';
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
} from '@/lib/product/context-capsule-pending';

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
  const requestedRedirect = planParam === 'analyst' || planParam === 'team'
    ? '/app/settings?tab=billing'
    : resolvePostLoginRedirect(searchParams, false);
  const returnUrl = new URL(requestedRedirect, 'https://praxis.invalid');
  if (capsulePromptParam?.trim() && (returnUrl.pathname === '/app' || returnUrl.pathname === '/app/capsules/builder')) {
    if (!returnUrl.searchParams.has('prompt') && !returnUrl.searchParams.has('capsulePrompt')) returnUrl.searchParams.set('capsulePrompt', capsulePromptParam.trim());
  }
  const appRedirect = `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`;
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
  const [interactive, setInteractive] = useState(false);
  const controlsDisabled = !interactive || loading || isLoading;
  useEffect(() => { setInteractive(true); }, []);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    try {
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
    } catch {
      // The safe workspace URL also carries the question when browser storage is unavailable.
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
    if (controlsDisabled) return;
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
    if (controlsDisabled) return;
    setError('');
    clearAuthError();
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      // Popup success and redirect return are both handled by onAuthStateChanged,
      // which syncs the secure app cookie and lets the effect above navigate.
      if (!result.success) {
        setError(result.error || 'Google sign-in failed.');
        setIsLoading(false);
      }
    } catch {
      setError('Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (controlsDisabled) return;
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

  const title = mode === 'signup' ? 'Invited account setup' : mode === 'reset' ? 'Reset your password' : 'Welcome to PRAXIS';
  const fieldClass = 'min-h-11 w-full rounded-lg border border-[var(--color-mineral)] bg-white px-3 py-2.5 text-base text-[var(--color-deep-ink)] placeholder:text-[var(--color-graphite)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-praxis-emerald-600)] disabled:opacity-60';

  function changeMode(next: 'signin' | 'signup' | 'reset') {
    setMode(next);
    setError('');
    setSuccessMsg('');
    clearAuthError();
  }

  return (
    <main className="civic-atelier-shell cartographic-grid flex min-h-screen items-center justify-center px-4 py-8 text-[var(--color-deep-ink)]">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex min-h-11 items-center"><PraxisBrandChip subtitle="Ask. Source. Review." /></Link>
        <section className="rounded-xl border border-[var(--color-mineral)] bg-[var(--color-archive-paper-strong)] p-5 sm:p-8" aria-labelledby="login-title">
          <h1 id="login-title" className="font-serif text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">
            {mode === 'reset' ? 'Enter your email to request a reset link.' : 'Access is invitation-only. AI generation is currently paused. Continue only with an invited account; this form does not grant an invitation.'}
          </p>
          {capsulePromptParam?.trim() ? (
            <div className="mt-4 rounded-lg border border-[var(--color-praxis-emerald-300)] bg-[var(--color-praxis-emerald-50)] p-3">
              <p className="text-xs font-semibold text-[var(--color-praxis-emerald-700)]">Your question is saved for sign-in</p>
              <p className="mt-1 line-clamp-3 break-words text-sm">{capsulePromptParam.trim()}</p>
            </div>
          ) : null}
          {mode !== 'reset' ? <>
            <button type="button" onClick={handleGoogleSignIn} disabled={controlsDisabled} className="mt-6 flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--color-mineral)] bg-white px-4 py-3 text-sm font-semibold hover:bg-[var(--color-archive-paper)] disabled:opacity-60">
              <Chrome className="h-5 w-5" aria-hidden="true" /> Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-graphite)]"><span className="h-px flex-1 bg-[var(--color-mineral)]" />or use email<span className="h-px flex-1 bg-[var(--color-mineral)]" /></div>
          </> : null}
          <form onSubmit={mode === 'reset' ? handleResetPassword : handleEmailSubmit} data-interactive={interactive && !loading ? 'true' : 'false'} aria-busy={controlsDisabled} className="mt-5 space-y-4">
            {mode === 'signup' ? <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
              <input id="name" name="name" autoComplete="name" type="text" value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="Your name" required disabled={controlsDisabled} className={fieldClass} />
            </div> : null}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="email" name="email" autoComplete="email" inputMode="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setSuccessMsg(''); }} placeholder="you@example.com" required disabled={controlsDisabled} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} className={fieldClass} />
            </div>
            {mode !== 'reset' ? <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                {mode === 'signin' ? <button type="button" onClick={() => changeMode('reset')} disabled={controlsDisabled} className="min-h-11 text-xs font-medium underline underline-offset-4">Forgot password?</button> : null}
              </div>
              <input id="password" name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} required minLength={mode === 'signup' ? 6 : undefined} disabled={controlsDisabled} aria-invalid={Boolean(error)} aria-describedby={mode === 'signup' ? 'password-help' : error ? 'login-error' : undefined} className={fieldClass} />
              {mode === 'signup' ? <p id="password-help" className="mt-2 text-xs text-[var(--color-graphite)]">Use at least 6 characters. {password ? `Password strength: ${passwordStrength.label}.` : 'A longer, unique password is best.'}</p> : null}
            </div> : null}
            {error ? <p id="login-error" role="alert" className="rounded-lg border border-[var(--color-evidence-review)] px-3 py-2 text-sm">{error}</p> : null}
            {successMsg ? <p role="status" className="rounded-lg bg-[var(--color-praxis-emerald-50)] px-3 py-2 text-sm">{successMsg}</p> : null}
            <button type="submit" disabled={controlsDisabled} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-praxis-emerald-700)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-praxis-emerald-800)] disabled:opacity-60">
              {isLoading || loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : mode === 'reset' ? <Mail className="h-4 w-4" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              {isLoading ? 'Please wait…' : mode === 'signup' ? 'Set up invited account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
            </button>
          </form>
          <div className="mt-3 text-center text-sm">
            {mode === 'signin' ? <button type="button" disabled={controlsDisabled} onClick={() => changeMode('signup')} className="min-h-11 font-medium underline underline-offset-4">Have an invitation? Set up your account</button> : <button type="button" disabled={controlsDisabled} onClick={() => changeMode('signin')} className="min-h-11 font-medium underline underline-offset-4">Back to sign in</button>}
          </div>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-[var(--color-graphite)]">Independent experimental software by Giulio Catanzariti. Workspace access is invitation-only; AI generation is paused and paid upgrades are currently unavailable.</p>
        <nav aria-label="Login information" className="mt-2 flex justify-center gap-4 text-xs text-[var(--color-graphite)]">
          <Link href="/legal/privacy" className="inline-flex min-h-11 items-center underline">Privacy</Link><Link href="/legal/terms" className="inline-flex min-h-11 items-center underline">Terms</Link><Link href="/guide" className="inline-flex min-h-11 items-center underline">How it works</Link>
        </nav>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="civic-atelier-shell flex min-h-screen items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-praxis-emerald-700)]" aria-hidden="true" />
          <span className="text-sm text-[var(--color-graphite)]">Loading sign-in…</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { Shield, ArrowRight, Loader2, Mail, Chrome, Paperclip, Upload, Monitor, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { resolvePostLoginRedirect } from '@/lib/auth/post-login-redirect';
import {
  getPolicyAgent,
  PENDING_POLICY_AGENT_ID_KEY,
  PENDING_TASKLET_PROMPT_KEY,
} from '@/lib/product/policy-agents';
import {
  CONTEXT_CAPSULE_TEMPLATES,
  PENDING_CONTEXT_CAPSULE_OUTPUT_KEY,
  PENDING_CONTEXT_CAPSULE_PATH_KEY,
  PENDING_CONTEXT_CAPSULE_PROMPT_KEY,
  PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY,
  POLICY_PATH_PROFILES,
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
  const planParam = searchParams.get('plan'); // e.g. ?plan=analyst from pricing page
  const capsulePromptParam = searchParams.get('capsulePrompt');
  const capsuleTemplateParam = searchParams.get('capsuleTemplate');
  const capsulePathParam = searchParams.get('capsulePath');
  const capsuleOutputParam = searchParams.get('capsuleOutput');
  const policyAgentParam = searchParams.get('policyAgentId');
  const appRedirect = planParam
    ? `/app/settings?upgrade=${planParam}` // Send to settings with upgrade prompt
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
      router.push('/app/dashboard');
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
  const [pendingCapsulePrompt, setPendingCapsulePrompt] = useState('');
  const [pendingCapsuleTemplateId, setPendingCapsuleTemplateId] = useState('');
  const [pendingCapsulePathId, setPendingCapsulePathId] = useState('');
  const [pendingCapsuleOutput, setPendingCapsuleOutput] = useState('');
  const [pendingPolicyAgentId, setPendingPolicyAgentId] = useState('');
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const pendingCapsuleTemplateLabel = useMemo(
    () => CONTEXT_CAPSULE_TEMPLATES.find((t) => t.id === pendingCapsuleTemplateId)?.label ?? '',
    [pendingCapsuleTemplateId],
  );
  const pendingCapsulePathLabel = useMemo(
    () => POLICY_PATH_PROFILES.find((path) => path.id === pendingCapsulePathId)?.label ?? '',
    [pendingCapsulePathId],
  );
  const pendingPolicyAgent = useMemo(
    () => getPolicyAgent(pendingPolicyAgentId),
    [pendingPolicyAgentId],
  );

  useEffect(() => {
    const prompt = capsulePromptParam?.trim();
    if (prompt) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY, prompt);
      window.localStorage.setItem(PENDING_TASKLET_PROMPT_KEY, prompt);
      setPendingCapsulePrompt(prompt);
    } else {
      setPendingCapsulePrompt(
        window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_PROMPT_KEY)
          ?? window.localStorage.getItem(PENDING_TASKLET_PROMPT_KEY)
          ?? '',
      );
    }
    if (capsuleTemplateParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY, capsuleTemplateParam);
      setPendingCapsuleTemplateId(capsuleTemplateParam);
    } else {
      setPendingCapsuleTemplateId(window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_TEMPLATE_KEY) ?? '');
    }
    if (capsulePathParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_PATH_KEY, capsulePathParam);
      setPendingCapsulePathId(capsulePathParam);
    } else {
      setPendingCapsulePathId(window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_PATH_KEY) ?? '');
    }
    if (capsuleOutputParam) {
      window.localStorage.setItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY, capsuleOutputParam);
      setPendingCapsuleOutput(capsuleOutputParam);
    } else {
      setPendingCapsuleOutput(window.localStorage.getItem(PENDING_CONTEXT_CAPSULE_OUTPUT_KEY) ?? '');
    }
    if (policyAgentParam) {
      window.localStorage.setItem(PENDING_POLICY_AGENT_ID_KEY, policyAgentParam);
      setPendingPolicyAgentId(policyAgentParam);
    } else {
      setPendingPolicyAgentId(window.localStorage.getItem(PENDING_POLICY_AGENT_ID_KEY) ?? '');
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
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.72fr)]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
          <div className="relative flex min-h-screen flex-col p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">PRAXIS by TACITUS</p>
                  <p className="text-xs text-slate-500">Private workspace</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Firebase Auth
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-center py-10">
              <p className="text-center text-sm font-medium text-slate-500">Same workspace before and after sign-in</p>
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
                  <span key={tab} className={cn('pb-3', index === 0 ? 'border-b-2 border-[#ff714d] text-[#ff714d]' : '')}>{tab}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-gold-500) 1px, transparent 0)`,
                backgroundSize: '44px 44px',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="rounded-xl border border-navy-700/50 bg-navy-900/88 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mb-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-gold-500/20 bg-gold-500/10">
              <Sparkles className="h-6 w-6 text-gold-500" />
            </div>
            <h1 className="font-serif text-3xl tracking-wide text-gold-500">
              PRAXIS
            </h1>
            <p className="mt-1.5 text-sm tracking-widest text-navy-400 uppercase">
              Sign in to continue
            </p>
          </motion.div>

          {pendingCapsulePrompt || pendingPolicyAgent ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-5 rounded-xl border border-gold-500/25 bg-gold-500/10 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-300">
                PRAXIS run queued{pendingPolicyAgent ? ` · ${pendingPolicyAgent.label}` : pendingCapsuleTemplateLabel ? ` · ${pendingCapsuleTemplateLabel}` : ''}
              </p>
              {pendingCapsulePrompt ? (
                <p className="mt-2 line-clamp-3 text-sm leading-5 text-navy-100">
                  {pendingCapsulePrompt}
                </p>
              ) : null}
              {pendingCapsulePathLabel || pendingCapsuleOutput ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingCapsulePathLabel ? (
                    <span className="rounded-full border border-gold-300/30 bg-navy-950/40 px-2 py-1 text-[11px] font-semibold text-gold-100">
                      Path: {pendingCapsulePathLabel}
                    </span>
                  ) : null}
                  {pendingCapsuleOutput ? (
                    <span className="rounded-full border border-gold-300/30 bg-navy-950/40 px-2 py-1 text-[11px] font-semibold text-gold-100">
                      Output: {pendingCapsuleOutput}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-navy-400">
                Sign in to preserve the prompt and open it inside your private PRAXIS workspace.
              </p>
            </motion.div>
          ) : null}

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
              or email
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
                  {mode === 'signup' ? 'Create PRAXIS workspace' : mode === 'reset' ? 'Send Reset Link' : 'Open PRAXIS'}
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
          >
            <p className="text-center text-xs text-emerald-400">
              <span className="font-semibold">Free Plan</span> includes capsules, source receipts, policy agents, and memo tools.
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 text-center text-xs text-navy-600"
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
        <div className="flex min-h-screen items-center justify-center bg-navy-950">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

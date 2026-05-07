"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-redirect";

function CallbackCard({
  title,
  body,
  tone = "loading",
}: {
  title: string;
  body: string;
  tone?: "loading" | "ready" | "error";
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-950 px-5 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-300">
          {tone === "error" ? (
            <ShieldAlert className="h-6 w-6" />
          ) : tone === "ready" ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" />
          )}
        </div>
        <h1 className="font-serif text-3xl text-white">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-navy-300">{body}</p>
        {tone === "error" ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-gold-500 px-4 text-sm font-semibold text-navy-950 hover:bg-gold-400"
            >
              Back to login
            </Link>
            <Link
              href="/waitlist"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-white/14 px-4 text-sm font-semibold text-navy-100 hover:bg-white/10"
            >
              Request access
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, authError } = useAuth();
  const redirectTo = resolvePostLoginRedirect(searchParams, Boolean(user?.isDemo));

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, router, user]);

  const hasError = !loading && !user && Boolean(authError);

  return (
    <CallbackCard
      title={hasError ? "Sign-in needs attention" : user ? "Session ready" : "Completing secure sign-in"}
      body={
        hasError
          ? authError ?? "The authentication return could not be completed."
          : user
            ? "Redirecting you into PRAXIS."
            : "PRAXIS is validating the authentication return and preparing your workspace session."
      }
      tone={hasError ? "error" : user ? "ready" : "loading"}
    />
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <CallbackCard
          title="Completing secure sign-in"
          body="PRAXIS is validating the authentication return and preparing your workspace session."
        />
      }
    >
      <LoginCallbackContent />
    </Suspense>
  );
}

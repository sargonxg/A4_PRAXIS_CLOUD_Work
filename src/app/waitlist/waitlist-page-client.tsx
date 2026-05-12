"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function WaitlistPageClient() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const mountedAtRef = useRef(Date.now());

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website,
          elapsedMs: Date.now() - mountedAtRef.current,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "We could not save this request.");
      }

      setState("success");
      setMessage("You're on the PRAXIS early-access list.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen bg-navy-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,185,49,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(232,185,49,0.18) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-[140px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-gold-400">
            PRAXIS
          </Link>
          <nav className="flex items-center gap-4 text-sm text-navy-200">
            <Link href="/app" className="hover:text-white">
              App
            </Link>
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_440px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Early access
          </div>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.03] text-white sm:text-6xl lg:text-7xl">
            Join the PRAXIS production cohort.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-navy-200">
            PRAXIS is the workbench for policy, conflict, mediation, and diplomacy
            professionals: live cases, graph-grounded context, specialist tools,
            and memo exports with human review.
          </p>
          <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
            {["Ask PRAXIS first", "Workspace onboarding", "Human-reviewed outputs"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-navy-100">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-md">
          <div className="mb-6">
            <h2 className="font-serif text-3xl text-white">Request access</h2>
            <p className="mt-2 text-sm leading-6 text-navy-300">
              We will use this email only for PRAXIS early-access updates and onboarding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-navy-100">Work email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@organization.org"
                  className="h-12 w-full rounded-md border border-white/14 bg-navy-950/70 px-10 text-sm text-white outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
                />
              </div>
            </label>

            <label className="hidden" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={state === "submitting" || state === "success"}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {state === "submitting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : state === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {state === "success" ? "Request received" : "Join waitlist"}
            </button>
          </form>

          {message ? (
            <p
              role={state === "error" ? "alert" : "status"}
              className={state === "error" ? "mt-4 text-sm text-red-300" : "mt-4 text-sm text-emerald-300"}
            >
              {message}
            </p>
          ) : null}

          <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-navy-400">
            Already approved?{" "}
            <Link href="/login" className="text-gold-300 hover:text-gold-200">
              Continue to login
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}

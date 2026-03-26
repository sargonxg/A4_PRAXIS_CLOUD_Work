# PRAXIS by TACITUS

**The conflict operating system for peace and security professionals.**

AI-powered analysis, knowledge graphs, and automated report generation — from raw data to decisive intelligence in minutes. 35+ tool pages, situation-driven AI pipeline, real-time data feeds.

> **v3.4** — Build 2026.03.25 · Deployed at [praxis.tacitus.me](https://praxis.tacitus.me)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo works with zero configuration.

## Two Experiences

| | Demo (`/demo/*`) | Real App (`/app/*`) |
|---|---|---|
| **Auth** | Cookie-only, no account | Firebase Google + email/password |
| **Data** | Pre-loaded Nordalia Crisis | User creates own situations |
| **AI** | Cached demo responses | Live Gemini Pro / Claude + Firecrawl |
| **Credits** | Unlimited | 100 on sign-up, deducted per use |
| **Purpose** | Investor demos, exploration | Real conflict intelligence work |

## Tool Pages

**Situation Room** — Dashboard, Early Warning, Risk Monitor, Conflict Graph, Stakeholder Map, Actor Profiles

**Analysis & Drafting** — PRAXIS Assistant, Report Studio, Dossier Generator, Talking Points, Scenario Planner, Negotiation Prep, CONCORDIA Mediation, Mediation Designer, Briefing Room, Daily Brief

**Intelligence Tools** — ARGUS Intelligence, Media Compass, Media Roundup, Info Environment, Commitment Tracker, Treaty Analyzer, Sanctions Tracker, Calendar Monitor, Alert Center, UN Toolkit

**Workspace** — Documents, Case Library, Team Hub

## AI Pipeline

All tools in real mode use `AiPopulate` → structured `generateText` + `Output.object()` with Zod schemas, powered by `gemini-2.5-pro` for analytical tools. Every AI call receives the full situation context (name, actors, region, risk score, escalation trend, description) via `buildToolContext()`. No hardcoded demo data leaks into real mode.

Analytical frameworks embedded in prompts: INFORM Risk Index, Fisher/Ury ZOPA/BATNA, Glasl escalation model, Mitchell/Agle/Wood stakeholder analysis, CRAAP test, NATO STRATCOM, Berghof process design, UN DPPA morning brief standard.

## Environment Variables

```bash
# Required for live AI
GOOGLE_AI_API_KEY=your_key

# Required for server-side Firestore
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"praxisbytacitus",...}

# Optional
ANTHROPIC_API_KEY=your_key          # Claude deep analysis
FIRECRAWL_API_KEY=your_key          # Web research
AI_PROVIDER=google                   # 'google' or 'vertex'
CRON_SECRET=your_secret              # Vercel cron job auth
```

## Firebase Setup

Project: `praxisbytacitus`

1. Enable Authentication providers: Google + Email/Password
2. Add your domain to Firebase Auth > Authorized domains
3. Generate a service account key: Firebase Console > Project Settings > Service Accounts > Generate new private key
4. Set `FIREBASE_SERVICE_ACCOUNT_KEY` in Vercel with the JSON contents
5. Deploy Firestore rules:
   ```bash
   firebase use praxisbytacitus
   firebase deploy --only firestore:rules
   ```

## Tech Stack

Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK (ai@6.0.105 + @ai-sdk/google + @ai-sdk/anthropic), Firebase Auth + Firestore + Admin SDK, Firecrawl, Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for full architecture docs and [ARCHITECTURE.md](./ARCHITECTURE.md) for the dual-app data flow diagrams.

## Deployment

Deployed on Vercel (iad1 region). Push to `main` triggers automatic deployment.

```bash
npm run build   # Verify build passes locally
git push        # Auto-deploys to Vercel
```

# PRAXIS by TACITUS

**The conflict operating system for peace and security professionals.**

AI-powered analysis, knowledge graphs, and automated report generation — from raw data to decisive intelligence in minutes.

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
| **AI** | Cached responses | Live Gemini/Claude + Firecrawl |
| **Credits** | Unlimited | 100 on sign-up, deducted per use |
| **Purpose** | Investor demos, exploration | Real conflict intelligence work |

## Environment Variables

```bash
# Required for live AI (real app)
GOOGLE_AI_API_KEY=your_key

# Required for server-side Firestore (situation CRUD, auth verification)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"praxisbytacitus",...}

# Optional
ANTHROPIC_API_KEY=your_key          # Claude deep analysis
FIRECRAWL_API_KEY=your_key          # Web research
AI_PROVIDER=google                   # 'google' or 'vertex'
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

Next.js 16.1.6 (App Router), TypeScript 5.9, Tailwind CSS 4, Radix UI, Vercel AI SDK, Firebase Auth + Firestore + Admin SDK, Firecrawl, Zustand 5, D3.js 7, Framer Motion 12, Zod 4.

## Architecture

See [CLAUDE.md](./CLAUDE.md) for full architecture docs and [ARCHITECTURE.md](./ARCHITECTURE.md) for the dual-app data flow diagrams.

## Deployment

Deployed on Vercel (iad1 region). Push to `main` triggers automatic deployment.

```bash
npm run build   # Verify build passes locally
git push        # Auto-deploys to Vercel
```

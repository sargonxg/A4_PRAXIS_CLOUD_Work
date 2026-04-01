# PRAXIS — Dual-App Architecture

> Canonical reference for the demo/production split. Updated as the codebase evolves.

## Route Architecture

```
/                         → Landing page (public)
/login                    → Unified login page (public)
/demo/dashboard           → Demo app entry (cookie auth)
/demo/assistant           → Demo AI chat (cached)
/demo/[any-tool]          → Demo tool pages (pre-loaded data)
/app/dashboard            → Real PRAXIS entry (Firebase auth)
/app/assistant            → Real AI chat (live, situation-bound)
/app/[any-tool]           → Real tool pages (situation-bound Firestore data)
/api/*                    → API routes (auth-protected)
/privacy, /terms          → Static pages (public)
```

## Login Flow

```mermaid
flowchart TD
    LP[Landing Page] -->|"Sign In / Create Account"| LOGIN[/login]
    LP -->|"Try Demo / Explore Demo"| DEMO_LOGIN["/login?mode=demo"]

    LOGIN -->|Google OAuth redirect| GOOGLE[Google OAuth]
    GOOGLE -->|Redirect back| LOGIN
    LOGIN -->|Email/Password auth| COOKIE[Set session cookie]
    DEMO_LOGIN -->|Sets demo cookie| DEMO[/demo/dashboard]
    COOKIE --> APP[/app/dashboard]

    LOGIN -->|"Forgot password?"| RESET[Reset mode]
    RESET -->|"sendPasswordResetEmail"| EMAIL[Firebase sends reset link]
    EMAIL -->|User clicks link| LOGIN

    APP -->|No situations| WIZARD[Situation Creation Wizard]
    WIZARD -->|Created| DASH[/app/dashboard with active situation]

    DEMO -->|"Exit Demo"| LP
    DEMO -->|"Get Full Access"| LOGIN
```

## Token Lifecycle

```mermaid
sequenceDiagram
    participant U as Browser
    participant FB as Firebase Auth
    participant API as /api/auth/session
    participant MW as middleware.ts
    participant APP as /app/* routes

    U->>FB: signIn (email/pass or Google)
    FB-->>U: FirebaseUser + ID token (60min TTL)
    U->>API: POST { token }
    API->>FB: verifyIdToken(token) — Admin SDK
    FB-->>API: decoded { uid }
    API-->>U: Set httpOnly cookie (24h)
    U->>APP: Navigate to /app/dashboard
    APP->>MW: Check cookie present
    MW-->>APP: Allow (cookie exists)

    Note over U,FB: At 50 minutes...
    U->>FB: getIdToken(true) — forced refresh
    FB-->>U: New ID token
    U->>API: POST { newToken }
    API-->>U: Cookie updated

    Note over U,FB: On sign-out...
    U->>API: DELETE /api/auth/session
    API-->>U: Cookie cleared
    U->>MW: Request /app/*
    MW-->>U: Redirect /login
```

## Situation-Driven Data Model (Real App Only)

Every piece of data in PRAXIS belongs to a situation:

```
Firestore:
  users/{uid}/
    profile (credits, settings, subscription)
    situations/{situationId}/
      metadata (name, type, region, description, actors, status)
      conflict-grammar (extracted ACO entities)
      graph (nodes + edges)
      documents/{docId} (uploaded files + extraction results)
      reports/{reportId} (generated reports)
      scenarios/{scenarioId} (what-if analyses)
      chats/{chatId} (conversation history)
      briefings/{briefId}
      dossiers/{dossierId}
      talking-points/{tpId}
      risk-assessments/{raId}
      timeline-events/{eventId}
      stakeholder-map
      negotiation-preps/{prepId}
      media-analyses/{maId}
      treaty-analyses/{taId}
      sanctions-scans/{scanId}
```

## Data Flow

```mermaid
flowchart LR
    subgraph DEMO["Demo App (/demo/*)"]
        D_STORE[In-Memory + localStorage] --> D_PAGES[Demo Pages]
        D_CONSTANTS[src/lib/constants/*] --> D_STORE
        D_CACHED[src/lib/demo/cached-responses.ts] --> D_API[API Routes - cached path]
    end

    subgraph REAL["Real App (/app/*)"]
        FIRESTORE[(Firestore)] --> R_STORE[Situation Store]
        R_STORE --> R_PAGES[Real Pages]
        R_PAGES -->|AI calls| AI_API[API Routes - live path]
        AI_API -->|Gemini / Claude| LLM[LLM Providers]
        AI_API -->|Web search| FIRECRAWL[Firecrawl]
        AI_API -->|Save results| FIRESTORE
    end
```

## Shared vs Separate Code

### Shared (both apps use)
- `src/components/ui/*` — Radix primitives
- `src/components/shared/*` — Display components
- `src/lib/ai/*` — Provider config, prompts, schemas, tools
- `src/lib/firebase/*` — Config, admin, Firestore helpers
- `src/lib/utils/*` — Formatting, cn, date helpers
- `src/types/*` — TypeScript types

### Demo-only
- `src/app/demo/*` — Demo path segment
- `src/components/demo/*` — Demo shell, sidebar, header
- `src/lib/demo/*` — Cached responses, demo data provider
- `src/lib/constants/*` — All demo case data (Nordalia, etc.)

### Real-app-only
- `src/app/app/*` — Production path segment
- `src/components/praxis/*` — Real app shell, sidebar, header
- `src/lib/services/*` — Firestore CRUD, AI pipelines
- `src/stores/situation-store.ts` — Active situation state

## Auth Matrix

| Route | Auth Required | Verification | Data Source | Credits |
|-------|--------------|-------------|-------------|---------|
| `/demo/*` | Demo cookie `{demo:true}` | Middleware cookie check | In-memory constants | Unlimited |
| `/app/*` | Firebase JWT cookie | Middleware cookie presence check | Firestore | Deducted |
| `/api/*` | `withAuth()` — `verifyIdToken` | Firebase Admin SDK (cryptographic) | Per-route | Per-route |
| `/api/auth/test-firebase` | None | Public ops endpoint | Firebase REST API | N/A |
| `/`, `/login`, etc. | None | Public | Static | N/A |

> Note: Middleware checks cookie **presence** only (UX guard). API routes do full cryptographic token verification — this is where actual security is enforced.

## Middleware Rules

```
/demo/*  → Require demo session cookie → else redirect /login?mode=demo
/app/*   → Require Firebase JWT cookie → else redirect /login
           If demo cookie → redirect /demo/dashboard
/api/*   → Handled by withAuth() per route handler
/*       → Public
```

# Boundary leaks

| file | pattern | recommendation |
|---|---|---|
| src/app/api/account/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/admin/add-credits/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/admin/advisor-feed/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/admin/domains/[id]/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/admin/operator-console/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/admin/set-all-credits/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/notifications/[id]/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/onboarding/draft/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/promo/redeem/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/situations/[id]/context-health/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |
| src/app/api/situations/[id]/cost-cap/route.ts | server/provider import in app boundary | Allowed for server route only if wrapped/gated; verify no client boundary import. |

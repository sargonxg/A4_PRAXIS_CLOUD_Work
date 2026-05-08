import { promises as fs } from 'node:fs';

interface Check {
  file: string;
  must: RegExp[];
  reason: string;
}

const CHECKS: Check[] = [
  {
    file: 'src/lib/auth/onboarding-status.ts',
    must: [/isOnboardingComplete/, /missingOnboardingFields/, /isProfileComplete/],
    reason: 'single source of truth for onboarding completeness must exist',
  },
  {
    file: 'src/lib/api/with-calibration.ts',
    must: [/isOnboardingComplete\s*\(/, /Onboarding required/],
    reason: 'calibrated routes must use the shared onboarding helper',
  },
  {
    file: 'src/app/(auth)/login/callback/page.tsx',
    must: [/onboardingComplete/, /resolvePostLoginRedirect/],
    reason: 'post-auth callback must route incomplete profiles to onboarding',
  },
  {
    file: 'src/lib/auth/post-login-redirect.ts',
    must: [/onboardingComplete/, /\/onboarding/],
    reason: 'redirect resolver must prefer onboarding for incomplete profiles',
  },
  {
    file: 'src/proxy.ts',
    must: [/onboardingComplete/, /\/onboarding/, /\/app\/:path\*/],
    reason: 'Next proxy must guard app deep links with the signed cookie claim',
  },
  {
    file: 'src/app/api/auth/session/route.ts',
    must: [/onboardingComplete/, /isUserOnboarded/, /signCookie/],
    reason: 'session cookie must include onboardingComplete from the server-side profile check',
  },
  {
    file: 'src/lib/firebase/analyst-profile-admin.ts',
    must: [/isOnboardingComplete/, /isUserOnboarded/],
    reason: 'server-side cookie claim check must use the shared onboarding helper',
  },
  {
    file: 'src/lib/auth/auth-context.tsx',
    must: [/isOnboardingComplete/, /const onboardingComplete = isOnboardingComplete\(analystProfile\)/],
    reason: 'client auth context must use the same onboarding completeness helper as calibrated routes',
  },
  {
    file: 'src/app/api/onboarding/complete/route.ts',
    must: [/onboardingComplete:\s*true/, /signCookie/],
    reason: 'completion route must refresh the session cookie claim',
  },
  {
    file: 'src/components/workbench/workbench-active-case.tsx',
    must: [/isOnboardingComplete/, /Complete onboarding/],
    reason: 'workbench must show a deep-link safety banner for incomplete profiles',
  },
  {
    file: 'src/app/app/profile/page.tsx',
    must: [/\/onboarding\?edit=1/, /Edit analyst profile/],
    reason: 'profile surface must expose edit-onboarding entry point',
  },
];

async function main() {
  const failures: string[] = [];
  for (const check of CHECKS) {
    let source = '';
    try {
      source = await fs.readFile(check.file, 'utf8');
    } catch {
      failures.push(`MISSING ${check.file}`);
      continue;
    }
    for (const pattern of check.must) {
      if (!pattern.test(source)) {
        failures.push(`${check.file}: must match ${pattern} - ${check.reason}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error('[audit:onboarding-gate] failures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('[audit:onboarding-gate] ok');
}

main().catch((err) => {
  console.error('[audit:onboarding-gate] threw:', err);
  process.exit(2);
});

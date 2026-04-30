#!/usr/bin/env tsx
import {
  getAdminGateStatus,
  getAdminPrincipalAccess,
} from '../src/lib/auth/admin-gate';

const email = process.argv[2] ?? 'giulio@tacitus.me';
const uid = process.argv[3] ?? 'local-check';
const verified = process.argv[4] !== 'unverified';
const access = getAdminPrincipalAccess({ uid, email, emailVerified: verified });
const gate = getAdminGateStatus();

console.log(JSON.stringify({
  input: { email, uid, emailVerified: verified },
  access,
  gate: {
    configuredUidCount: gate.configuredUidCount,
    configuredEmailAllowlist: gate.configuredEmailAllowlist,
    usingDefaultEmailAllowlist: gate.usingDefaultEmailAllowlist,
  },
  productionNote: 'Production cloudbuild.yaml sets ADMIN_EMAIL_ALLOWLIST=giulio@tacitus.me,giuliocatanzariti@gmail.com.',
}, null, 2));

if (!access.admin) process.exitCode = 1;

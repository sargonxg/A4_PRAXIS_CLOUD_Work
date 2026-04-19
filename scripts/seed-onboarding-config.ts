#!/usr/bin/env tsx
/**
 * Seeds config/onboarding_suggestions in Firestore.
 * Run: npx tsx scripts/seed-onboarding-config.ts
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var.
 */
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FALLBACK_CHIPS } from '../src/lib/constants/onboarding-chips';

async function main() {
  if (!getApps().length) {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
    initializeApp({ credential: cert(JSON.parse(saKey)) });
  }
  const db = getFirestore();
  await db.collection('config').doc('onboarding_suggestions').set({
    ...FALLBACK_CHIPS,
    updatedAt: new Date().toISOString(),
    seededBy: 'scripts/seed-onboarding-config.ts',
  });
  console.log('Seeded config/onboarding_suggestions');
}

main().catch(err => { console.error(err); process.exit(1); });

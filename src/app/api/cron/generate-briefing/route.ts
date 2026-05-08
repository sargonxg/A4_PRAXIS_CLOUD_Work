import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const maxDuration = 60;

/**
 * Cron job: Generate daily intelligence briefs for all active situations.
 * Runs daily at 05:00 UTC via Cloud Scheduler.
 * Secured by CRON_SECRET header.
 *
 * Process:
 * 1. List all active situations from Firestore (all users)
 * 2. For each situation, generate a structured morning brief via AI
 * 3. Store to Firestore at users/{uid}/situations/{sitId}/auto-briefings/{date}
 */

const BriefingSchema = z.object({
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  trend: z.enum(['escalating', 'stable', 'de-escalating']),
  headline: z.string(),
  keyDevelopments: z.array(z.string()).min(3).max(6),
  securitySituation: z.string(),
  politicalDynamics: z.string(),
  humanitarianUpdate: z.string(),
  mediaEnvironment: z.string(),
  actionItems: z.array(z.string()).min(3).max(6),
  nextReview: z.string(),
});

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  const startedAt = new Date().toISOString();
  console.log('[cron] Daily briefing generation started at', startedAt);

  let adminDb: FirebaseFirestore.Firestore | null = null;
  try {
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    adminDb = getAdminDbOrThrow();
  } catch {
    console.warn('[cron] Firestore Admin not available — dry run only');
  }

  // Collect active situations across all users
  interface SituationRecord {
    uid: string;
    id: string;
    name: string;
    region: string;
    actors: string[];
    description: string;
  }

  const situations: SituationRecord[] = [];

  if (adminDb) {
    const usersSnap = await adminDb.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      try {
        const sitSnap = await adminDb
          .collection('users').doc(userDoc.id)
          .collection('situations')
          .where('status', '==', 'active')
          .get();
        for (const sitDoc of sitSnap.docs) {
          const d = sitDoc.data();
          situations.push({
            uid: userDoc.id,
            id: sitDoc.id,
            name: d.name || '',
            region: d.region || '',
            actors: d.actors || [],
            description: d.description || '',
          });
        }
      } catch {
        // Skip users without situations sub-collection
      }
    }
  }

  console.log(`[cron] Found ${situations.length} active situations`);

  if (situations.length === 0) {
    return NextResponse.json({
      generated: 0,
      stored: 0,
      timestamp: startedAt,
      message: 'No active situations',
    });
  }

  let generated = 0;
  let stored = 0;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (const sit of situations) {
    try {
      const sitContext = [
        `Situation: ${sit.name}`,
        sit.region ? `Region: ${sit.region}` : '',
        sit.actors.length ? `Key actors: ${sit.actors.join(', ')}` : '',
        sit.description ? `Context: ${sit.description}` : '',
      ].filter(Boolean).join('\n');

      const result = await generateText({
        model: getModel(),
        output: Output.object({ schema: BriefingSchema }),
        prompt: `${sitContext}\n\nGenerate a daily intelligence brief for this conflict situation.

Format: professional morning note standard. Be specific, evidence-grounded, and actionable.
Risk levels: critical=active hostilities/atrocity risk, high=ceasefire violations/humanitarian blockage, medium=tension with process ongoing, low=stable.
Trend: escalating/stable/de-escalating based on recent trajectory.
Include 3-5 key developments, section analysis for security/political/humanitarian/media, 3-5 action items, and next review trigger.`,
        system: 'You are a senior senior multilateral diplomacy practitioner writing daily situation briefs for senior diplomatic staff.',
      });

      generated++;

      if (adminDb) {
        await adminDb
          .collection('users').doc(sit.uid)
          .collection('situations').doc(sit.id)
          .collection('auto-briefings').doc(today)
          .set({
            ...result.output,
            situationId: sit.id,
            situationName: sit.name,
            generatedAt: new Date().toISOString(),
            generatedBy: 'cron',
          });
        stored++;
      }

      // Respect API rate limits between situations
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[cron] Failed to generate brief for situation "${sit.name}":`, err);
    }
  }

  console.log(`[cron] Daily briefing complete. Generated: ${generated}, Stored: ${stored}`);

  return NextResponse.json({
    generated,
    stored,
    timestamp: startedAt,
    situationsProcessed: situations.length,
  });
}

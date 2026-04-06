import { NextResponse } from 'next/server';
import { searchArticles } from '@/lib/data-feeds/gdelt-client';
import { getCurrentStability } from '@/lib/data-feeds/gdelt-stability';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SituationAlert {
  situationId: string;
  situationName: string;
  uid: string;
  type: 'tone_spike' | 'volume_spike' | 'stability_shift' | 'high_severity_event';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  source: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

// Tone thresholds: GDELT tone ranges from roughly -25 to +25.
// Goldstein-style deviation: tones beyond +/- 5 are noteworthy,
// beyond +/- 8 are significant.
const TONE_THRESHOLD_HIGH = 8;
const TONE_THRESHOLD_MEDIUM = 5;

/**
 * Cron job: Check all active situations for alert conditions.
 * Runs daily at 06:00 UTC via Vercel Cron (configured in vercel.json).
 * Secured by CRON_SECRET header.
 *
 * Process:
 * 1. List all active situations from Firestore (all users)
 * 2. For each, fetch latest GDELT data and stability scores
 * 3. Compare against alert thresholds (tone spikes, volume anomalies)
 * 4. Store alerts to Firestore for display on the dashboard
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[cron] Alert check started at', new Date().toISOString());

    // Dynamically import admin SDK — only available when service account is configured
    let adminDb: FirebaseFirestore.Firestore | null = null;
    try {
      const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
      adminDb = getAdminDbOrThrow();
    } catch {
      console.warn('[cron] Firestore Admin not available — running in dry-run mode');
    }

    // -----------------------------------------------------------------------
    // 1. Collect all active situations across all users
    // -----------------------------------------------------------------------
    interface SituationWithOwner {
      uid: string;
      id: string;
      name: string;
      region: string;
      actors: string[];
      riskScore: number;
    }

    const situations: SituationWithOwner[] = [];

    if (adminDb) {
      const usersSnap = await adminDb.collection('users').get();
      for (const userDoc of usersSnap.docs) {
        try {
          const sitSnap = await adminDb
            .collection('users')
            .doc(userDoc.id)
            .collection('situations')
            .where('status', '==', 'active')
            .get();
          for (const sitDoc of sitSnap.docs) {
            const data = sitDoc.data();
            situations.push({
              uid: userDoc.id,
              id: sitDoc.id,
              name: data.name || '',
              region: data.region || '',
              actors: data.actors || [],
              riskScore: data.riskScore || 0,
            });
          }
        } catch {
          // Skip users where situations sub-collection doesn't exist
        }
      }
    }

    console.log(`[cron] Found ${situations.length} active situations to check`);

    if (situations.length === 0) {
      return NextResponse.json({
        checked: 0,
        alertsGenerated: 0,
        timestamp: new Date().toISOString(),
        message: 'No active situations found',
      });
    }

    // -----------------------------------------------------------------------
    // 2. For each situation, fetch GDELT data and check for alert conditions
    // -----------------------------------------------------------------------
    const allAlerts: SituationAlert[] = [];

    for (const sit of situations) {
      const query = sit.name || sit.region;
      if (!query) continue;

      try {
        // Fetch recent GDELT articles (last 24 hours)
        const articles = await searchArticles({
          query,
          timespan: '24h',
          maxRecords: 30,
        });

        // Fetch stability score for the region
        const countryCode = sit.region.slice(0, 2).toUpperCase();
        const stability = await getCurrentStability(countryCode);

        // --- Check for significant tone deviations (Goldstein-scale proxy) ---
        const highToneArticles = articles.filter(
          (a) => Math.abs(a.tone) >= TONE_THRESHOLD_HIGH
        );
        const mediumToneArticles = articles.filter(
          (a) => Math.abs(a.tone) >= TONE_THRESHOLD_MEDIUM && Math.abs(a.tone) < TONE_THRESHOLD_HIGH
        );

        // Critical alerts: extremely negative tone articles
        for (const article of highToneArticles) {
          allAlerts.push({
            situationId: sit.id,
            situationName: sit.name,
            uid: sit.uid,
            type: 'tone_spike',
            severity: article.tone < -TONE_THRESHOLD_HIGH ? 'critical' : 'high',
            title: `High-severity media signal: ${article.title.slice(0, 120)}`,
            description: `GDELT detected article with extreme tone (${article.tone.toFixed(1)}) from ${article.domain}. This indicates strong negative sentiment or escalatory language.`,
            source: 'gdelt',
            url: article.url,
            metadata: {
              tone: article.tone,
              domain: article.domain,
              sourcecountry: article.sourcecountry,
              seendate: article.seendate,
            },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }

        // Volume spike: if more than 20 articles in 24h, that's notable
        if (articles.length >= 20) {
          allAlerts.push({
            situationId: sit.id,
            situationName: sit.name,
            uid: sit.uid,
            type: 'volume_spike',
            severity: articles.length >= 25 ? 'high' : 'medium',
            title: `Media volume spike: ${articles.length} articles in 24h for "${sit.name}"`,
            description: `Unusually high media attention detected. ${highToneArticles.length} articles with extreme tone, ${mediumToneArticles.length} with elevated tone. Top domains: ${[...new Set(articles.slice(0, 5).map((a) => a.domain))].join(', ')}.`,
            source: 'gdelt',
            metadata: {
              articleCount: articles.length,
              highToneCount: highToneArticles.length,
              averageTone: articles.length > 0
                ? articles.reduce((sum, a) => sum + a.tone, 0) / articles.length
                : 0,
            },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }

        // Stability shift: worsening trend from GDELT stability API
        if (stability && stability.trend === 'worsening') {
          allAlerts.push({
            situationId: sit.id,
            situationName: sit.name,
            uid: sit.uid,
            type: 'stability_shift',
            severity: stability.score > 5 ? 'high' : 'medium',
            title: `Stability deterioration detected in ${sit.region}`,
            description: `GDELT stability index shows worsening trend. 7-day average: ${stability.recent7d.toFixed(2)}, 30-day baseline: ${stability.baseline30d.toFixed(2)}. This may indicate emerging instability.`,
            source: 'gdelt',
            metadata: {
              stabilityScore: stability.score,
              recent7d: stability.recent7d,
              baseline30d: stability.baseline30d,
              trend: stability.trend,
            },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }

        // Rate limit: GDELT allows ~1 req/sec, so pause between situations
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (err) {
        console.error(`[cron] Failed to check alerts for situation "${sit.name}":`, err);
      }
    }

    console.log(`[cron] Generated ${allAlerts.length} alerts`);

    // -----------------------------------------------------------------------
    // 3. Store alerts to Firestore
    // -----------------------------------------------------------------------
    let storedCount = 0;

    if (adminDb && allAlerts.length > 0) {
      // Group alerts by user
      const alertsByUser = new Map<string, SituationAlert[]>();
      for (const alert of allAlerts) {
        const existing = alertsByUser.get(alert.uid) || [];
        existing.push(alert);
        alertsByUser.set(alert.uid, existing);
      }

      for (const [uid, userAlerts] of alertsByUser) {
        try {
          const batch = adminDb.batch();

          for (const alert of userAlerts) {
            const alertRef = adminDb
              .collection('users')
              .doc(uid)
              .collection('situations')
              .doc(alert.situationId)
              .collection('alerts')
              .doc();

            batch.set(alertRef, alert);
            storedCount++;
          }

          await batch.commit();
        } catch (err) {
          console.error(`[cron] Failed to store alerts for user ${uid}:`, err);
        }
      }
    }

    console.log(`[cron] Alert check complete. Checked: ${situations.length}, Alerts stored: ${storedCount}`);

    return NextResponse.json({
      checked: situations.length,
      alertsGenerated: allAlerts.length,
      alertsStored: storedCount,
      timestamp: new Date().toISOString(),
      summary: {
        toneSpikes: allAlerts.filter((a) => a.type === 'tone_spike').length,
        volumeSpikes: allAlerts.filter((a) => a.type === 'volume_spike').length,
        stabilityShifts: allAlerts.filter((a) => a.type === 'stability_shift').length,
      },
    });
  } catch (err) {
    console.error('[cron] Alert check failed:', err);
    return NextResponse.json({ error: 'Alert check failed' }, { status: 500 });
  }
}

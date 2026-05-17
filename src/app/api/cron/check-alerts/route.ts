import { NextResponse } from 'next/server';
import { getGroundedSearchEvents } from '@/lib/data-feeds/grounded-search-client';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SituationAlert {
  situationId: string;
  situationName: string;
  uid: string;
  type: 'volume_spike' | 'high_severity_event';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  source: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

/**
 * Cron job: Check all active situations for alert conditions.
 * Runs daily at 06:00 UTC via Cloud Scheduler.
 * Secured by CRON_SECRET header.
 *
 * Process:
 * 1. List all active situations from Firestore (all users)
 * 2. For each, fetch latest Google-grounded web signals
 * 3. Compare against alert thresholds (volume and high-severity events)
 * 4. Store alerts to Firestore for display on the dashboard
 */
export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

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
    // 2. For each situation, fetch grounded web data and check alert conditions
    // -----------------------------------------------------------------------
    const allAlerts: SituationAlert[] = [];

    for (const sit of situations) {
      const query = sit.name || sit.region;
      if (!query) continue;

      try {
        const events = await getGroundedSearchEvents({
          query,
          country: sit.region,
          limit: 12,
        });

        const highSeverityEvents = events.filter((event) => event.severity === 'critical' || event.severity === 'high');

        for (const event of highSeverityEvents) {
          allAlerts.push({
            situationId: sit.id,
            situationName: sit.name,
            uid: sit.uid,
            type: 'high_severity_event',
            severity: event.severity === 'critical' ? 'critical' : 'high',
            title: `High-severity web signal: ${event.title.slice(0, 120)}`,
            description: event.description,
            source: 'google_search',
            url: event.url,
            metadata: {
              publishedAt: event.date,
              source: event.source,
            },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }

        if (events.length >= 10) {
          allAlerts.push({
            situationId: sit.id,
            situationName: sit.name,
            uid: sit.uid,
            type: 'volume_spike',
            severity: events.length >= 12 ? 'high' : 'medium',
            title: `Web signal volume spike: ${events.length} current results for "${sit.name}"`,
            description: `Grounded Google Search returned a dense cluster of current results. High-severity items: ${highSeverityEvents.length}.`,
            source: 'google_search',
            metadata: {
              resultCount: events.length,
              highSeverityCount: highSeverityEvents.length,
              urls: events.slice(0, 5).map((event) => event.url),
            },
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
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
        highSeverityEvents: allAlerts.filter((a) => a.type === 'high_severity_event').length,
        volumeSpikes: allAlerts.filter((a) => a.type === 'volume_spike').length,
      },
    });
  } catch (err) {
    console.error('[cron] Alert check failed:', err);
    return NextResponse.json({ error: 'Alert check failed' }, { status: 500 });
  }
}

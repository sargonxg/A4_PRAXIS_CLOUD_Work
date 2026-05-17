/**
 * GET /api/situations/[id]/inspect
 *
 * Returns everything stored about an active situation for the read-only
 * Situation Inspector page:
 *   {
 *     situation,         // full AdminSituation document
 *     documents: [{ id, name, size, extractedTextPreview }],
 *     toolsCache: [{ toolId, generatedAt, profileVersion }],
 *     episodes: null,    // not implemented yet — gracefully omitted
 *     resolvedDomain,    // MergedDomainConfig for the situation's domain
 *   }
 *
 * Read-only debug surface — does NOT deduct credits and does NOT invoke AI.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { resolveDomain } from '@/lib/domain/resolve';

type RouteContext = { params: Promise<{ id: string }> };

interface DocumentPreview {
  id: string;
  name: string;
  size: number;
  extractedTextPreview: string;
  status?: string;
  uploadedAt?: string;
}

interface ToolCacheEntry {
  toolId: string;
  generatedAt: unknown;
  profileVersion: number | null;
}

const TEXT_PREVIEW_CHARS = 400;

export function GET(req: NextRequest, ctx: RouteContext) {
  return withAuth(async (_r, user) => {
    if (user.isDemo) {
      return NextResponse.json(
        { error: 'Not available for this session' },
        { status: 403 },
      );
    }

    const { id } = await ctx.params;
    const situation = await getSituationAdmin(user.uid, id);
    if (!situation) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }

    let documents: DocumentPreview[] = [];
    let toolsCache: ToolCacheEntry[] = [];

    try {
      const db = getAdminDbOrThrow();
      const sitRef = db
        .collection('users')
        .doc(user.uid)
        .collection('situations')
        .doc(id);

      const [docsSnap, toolsSnap] = await Promise.all([
        sitRef.collection('documents').limit(50).get(),
        sitRef.collection('tools').limit(100).get(),
      ]);

      documents = docsSnap.docs.map((d) => {
        const data = d.data() as {
          title?: string;
          fileType?: string;
          size?: number;
          text?: string;
          extractedText?: string;
          status?: string;
          uploadedAt?: string;
        };
        const fullText = data.text ?? data.extractedText ?? '';
        return {
          id: d.id,
          name: data.title ?? d.id,
          size: typeof data.size === 'number' ? data.size : 0,
          extractedTextPreview:
            fullText.length > TEXT_PREVIEW_CHARS
              ? `${fullText.slice(0, TEXT_PREVIEW_CHARS)}…`
              : fullText,
          status: data.status,
          uploadedAt: data.uploadedAt,
        };
      });

      toolsCache = toolsSnap.docs.map((d) => {
        const data = d.data() as {
          toolId?: string;
          generatedAt?: unknown;
          profileVersion?: number;
        };
        return {
          toolId: data.toolId ?? d.id,
          generatedAt: data.generatedAt ?? null,
          profileVersion:
            typeof data.profileVersion === 'number' ? data.profileVersion : null,
        };
      });
    } catch (err) {
      console.warn('[situations/inspect] subcollection read failed:', err);
    }

    const resolvedDomain = await resolveDomain(situation.domain ?? 'generic');

    // Episodes not implemented in v1 — gracefully return null
    const episodes = null;

    return NextResponse.json({
      situation,
      documents,
      toolsCache,
      episodes,
      resolvedDomain,
    });
  })(req);
}

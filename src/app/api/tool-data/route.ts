import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  saveToolData,
  getToolData,
  deleteToolData,
} from '@/lib/firebase/tool-data-service';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const situationId = searchParams.get('situationId');

  if (!toolId || !situationId) {
    return NextResponse.json(
      { error: 'toolId and situationId are required' },
      { status: 400 }
    );
  }

  if (user.isDemo) {
    return NextResponse.json({ data: null });
  }

  try {
    const result = await getToolData(user.uid, situationId, toolId);
    return NextResponse.json(result ?? { data: null });
  } catch (err) {
    console.error('[tool-data] GET failed:', err);
    return NextResponse.json(
      { error: 'Failed to load tool data' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const { toolId, situationId, data } = body;

    if (!toolId || !situationId) {
      return NextResponse.json(
        { error: 'toolId and situationId are required' },
        { status: 400 }
      );
    }

    if (data === undefined) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    await saveToolData(user.uid, situationId, toolId, data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[tool-data] POST failed:', err);
    return NextResponse.json(
      { error: 'Failed to save tool data' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const toolId = searchParams.get('toolId');
  const situationId = searchParams.get('situationId');

  if (!toolId || !situationId) {
    return NextResponse.json(
      { error: 'toolId and situationId are required' },
      { status: 400 }
    );
  }

  if (user.isDemo) {
    return NextResponse.json({ success: true });
  }

  try {
    await deleteToolData(user.uid, situationId, toolId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[tool-data] DELETE failed:', err);
    return NextResponse.json(
      { error: 'Failed to delete tool data' },
      { status: 500 }
    );
  }
});

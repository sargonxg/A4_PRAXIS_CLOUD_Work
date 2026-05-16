import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    await request.json().catch(() => ({}));

    return NextResponse.json(
      { error: 'Use Firebase Auth for authentication.', success: false },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 400 }
    );
  }
}

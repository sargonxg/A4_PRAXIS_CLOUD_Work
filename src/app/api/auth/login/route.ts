import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth/mock-auth';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const user = await signIn(email);
    return NextResponse.json({ user, success: true });
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 400 }
    );
  }
}

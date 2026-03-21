import { NextResponse } from 'next/server';
import { signIn, signInDemo } from '@/lib/auth/mock-auth';

export async function POST(request: Request) {
  try {
    const { email, password, isDemo } = await request.json();

    if (isDemo === true) {
      const user = await signInDemo();
      return NextResponse.json({ user, success: true });
    }

    const user = await signIn(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. Contact team@tacitus.me for demo access.', success: false },
        { status: 401 }
      );
    }

    return NextResponse.json({ user, success: true });
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed', success: false },
      { status: 400 }
    );
  }
}

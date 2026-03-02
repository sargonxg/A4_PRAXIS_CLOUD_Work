import { NextResponse } from 'next/server';
import { signOut } from '@/lib/auth/mock-auth';

export async function POST() {
  await signOut();
  return NextResponse.json({ success: true });
}

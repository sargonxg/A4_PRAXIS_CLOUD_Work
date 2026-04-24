import { NextResponse } from 'next/server';
import { listAdvisors } from '@/lib/firebase/advisor-service';

export const GET = async () => {
  try {
    const advisors = await listAdvisors();
    return NextResponse.json(advisors);
  } catch (err) {
    console.warn('[advisors] list failed:', err);
    return NextResponse.json([]);
  }
};

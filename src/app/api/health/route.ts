import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firebase: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      googleAI: !!process.env.GOOGLE_AI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      firecrawl: !!process.env.FIRECRAWL_API_KEY,
      parallel: !!process.env.PARALLEL_API_KEY,
    },
  });
}

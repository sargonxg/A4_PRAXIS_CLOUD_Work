import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    situationId: id,
    monthlyCreditsUsed: 312,
    monthlyCreditCap: 500,
    status: 'ok',
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { monthlyCreditCap?: number };
  return NextResponse.json({
    situationId: id,
    monthlyCreditCap: body.monthlyCreditCap ?? 500,
    status: 'updated',
  });
}

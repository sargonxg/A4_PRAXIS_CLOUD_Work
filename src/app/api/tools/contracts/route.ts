import { NextResponse } from 'next/server';
import { getAllToolOperatingContracts, getToolOperatingContract } from '@/lib/tools/tool-operating-contracts';
import { getToolById } from '@/lib/constants/tool-registry';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('toolId');

  if (toolId) {
    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json({ error: 'unknown_tool', toolId }, { status: 404 });
    }
    return NextResponse.json({
      tool,
      contract: getToolOperatingContract(toolId),
      generatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    contracts: getAllToolOperatingContracts(),
    generatedAt: new Date().toISOString(),
  });
}

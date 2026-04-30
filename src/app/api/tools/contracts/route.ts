import { NextResponse } from 'next/server';
import { getAllToolOperatingContracts, getToolOperatingContract } from '@/lib/tools/tool-operating-contracts';
import { getAllToolContextBlueprints, getToolContextBlueprint } from '@/lib/tools/tool-context-blueprints';
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
      contextBlueprint: getToolContextBlueprint(toolId),
      generatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    contracts: getAllToolOperatingContracts(),
    contextBlueprints: getAllToolContextBlueprints(),
    generatedAt: new Date().toISOString(),
  });
}

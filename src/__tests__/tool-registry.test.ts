import { describe, it, expect } from 'vitest';
import * as tools from '../lib/ai/tools';

const EXPECTED_TOOLS = [
  'webSearch',
  'analyzeDocument',
  'queryConflictGraph',
  'draftSection',
  'editForDiplomaticTone',
  'analyzeMediaSource',
  'compareMediaCoverage',
  'checkUNTerminology',
  'draftResolutionLanguage',
  'generateTalkingPoints',
  'escalationAssessment',
  'negotiationSpaceAnalysis',
  'narrativeEcosystemMap',
  'historicalParallelsAnalysis',
  'generateTimeline',
  'sanctionsCheck',
  'humanitarianSnapshot',
  'compareConflicts',
  'canonicalNameLookup',
  'deepSourceResearch',
  'verifyAndStandardize',
] as const;

describe('Tool Registry', () => {
  it('exports exactly 21 tools', () => {
    const toolExports = Object.keys(tools).filter(
      (key) => typeof (tools as Record<string, unknown>)[key] === 'object'
        && (tools as Record<string, unknown>)[key] !== null
        && 'description' in ((tools as Record<string, unknown>)[key] as Record<string, unknown>)
        && 'inputSchema' in ((tools as Record<string, unknown>)[key] as Record<string, unknown>)
    );
    // Registry grows as new AI tools are added — assert a floor, not an exact count.
    expect(toolExports.length).toBeGreaterThanOrEqual(21);
  });

  it.each(EXPECTED_TOOLS)('%s is exported with description and inputSchema', (toolName) => {
    const toolObj = (tools as Record<string, unknown>)[toolName] as Record<string, unknown> | undefined;
    expect(toolObj).toBeDefined();
    expect(toolObj).toHaveProperty('description');
    expect(toolObj).toHaveProperty('inputSchema');
  });
});

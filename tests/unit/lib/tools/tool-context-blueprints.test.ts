import { describe, expect, it } from 'vitest';
import {
  buildToolContextBlueprintPrompt,
  getAllToolContextBlueprints,
  getToolContextBlueprint,
  getToolContextReadiness,
} from '@/lib/tools/tool-context-blueprints';

describe('tool context blueprints', () => {
  it('creates one blueprint per registered tool', () => {
    const blueprints = getAllToolContextBlueprints();
    expect(blueprints.length).toBeGreaterThanOrEqual(50);
    expect(blueprints.every((blueprint) => blueprint.database.canonicalOutputPath.includes('/tool-data/'))).toBe(true);
  });

  it('marks policy memo as a drafting and document-production tool', () => {
    const blueprint = getToolContextBlueprint('policy-memo');
    expect(blueprint.requiredLayers).toContain('drafting-constraints');
    expect(blueprint.requiredLayers).toContain('document-corpus');
    expect(blueprint.documentProduction.supportsLibreOfficeExport).toBe(true);
    expect(blueprint.documentProduction.artifactTypes).toContain('policy memo');
    expect(blueprint.evidencePolicy.mustShowProvenance).toBe(true);
  });

  it('marks conflict graph as graph read-write and Dialectica-ready', () => {
    const blueprint = getToolContextBlueprint('conflict-graph');
    expect(blueprint.graphBackbone.currentMode).toBe('read-write');
    expect(blueprint.requiredLayers).toContain('graph-backbone');
    expect(blueprint.graphBackbone.futureDialecticaRole).toContain('Dialectica');
  });

  it('marks source scout as live research with source-library context', () => {
    const blueprint = getToolContextBlueprint('source-scout');
    expect(blueprint.requiredLayers).toContain('live-web-research');
    expect(blueprint.requiredLayers).toContain('source-library');
    expect(blueprint.evidencePolicy.primarySources).toContain('grounded web search receipts');
  });

  it('computes situation readiness from required fields', () => {
    const readiness = getToolContextReadiness('risk-monitor', {
      name: 'Test situation',
      region: 'Eastern Mediterranean',
      actors: ['Actor A'],
    });
    expect(readiness.ready).toBe(false);
    expect(readiness.missingSituationFields).toContain('description');
    expect(readiness.nextQuestion).toContain('description');
  });

  it('renders a prompt block routes can reuse', () => {
    const prompt = buildToolContextBlueprintPrompt('policy-memo');
    expect(prompt).toContain('PRAXIS Tool Context Blueprint');
    expect(prompt).toContain('Canonical output path');
    expect(prompt).toContain('Document export');
  });
});

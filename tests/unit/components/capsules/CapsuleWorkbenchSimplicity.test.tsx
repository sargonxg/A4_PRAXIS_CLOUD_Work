import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleWorkbenchPanel } from '@/components/capsules/CapsuleWorkbenchPanel';
import {
  CAPSULE_CATEGORY_PALETTE,
  CAPSULE_CATEGORY_IDS,
  getCapsuleCategoryPalette,
} from '@/lib/constants/aco-colors';

describe('CapsuleWorkbenchPanel simple-default contract', () => {
  it('uses one canonical accessible palette for the four capsule categories', () => {
    expect(CAPSULE_CATEGORY_IDS).toEqual(['user', 'situation', 'tools', 'output']);

    const accents = CAPSULE_CATEGORY_IDS.map((id) => CAPSULE_CATEGORY_PALETTE[id].accent);
    expect(new Set(accents).size).toBe(4);

    for (const id of CAPSULE_CATEGORY_IDS) {
      const palette = getCapsuleCategoryPalette(id);
      expect(palette.label).toMatch(/User|Situation|Tools|Output/);
      expect(palette.icon).toMatch(/UserRound|Target|Wrench|FileText/);
      expect(palette.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.bg).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.border).toMatch(/^#[0-9A-F]{6}$/i);
      expect(palette.text).toMatch(/^#[0-9A-F]{6}$/i);
    }

    expect(getCapsuleCategoryPalette('tool')).toBe(CAPSULE_CATEGORY_PALETTE.tools);
    expect(getCapsuleCategoryPalette('users')).toBe(CAPSULE_CATEGORY_PALETTE.user);
  });

  it('opens with only the clean capsule summary, category chips, and primary actions visible', () => {
    const html = renderToStaticMarkup(
      <CapsuleWorkbenchPanel
        capsule={{
          capsuleId: 'cap-simple',
          label: 'Horn of Africa memo capsule',
          version: 4,
          readiness: { score: 82, tier: 'green' },
          coreRefs: {
            userCoreId: 'user-core-1',
            situationCoreId: 'situation-core-1',
            toolCoreIds: ['tool-core-1'],
            outputCoreIds: ['memo-output-1'],
            sourceCoreIds: ['source-1'],
          },
          claimLedger: [{ claimId: 'cl-1', text: 'Talks resumed.', support: 'supported', sourceIds: ['source-1'] }],
        }}
      />,
    );

    expect(html).toContain('Horn of Africa memo capsule');
    expect(html).toContain('Ready 82');
    expect(html).toContain('data-testid="capsule-category-chip-user"');
    expect(html).toContain('data-testid="capsule-category-chip-situation"');
    expect(html).toContain('data-testid="capsule-category-chip-tools"');
    expect(html).toContain('data-testid="capsule-category-chip-output"');
    expect(html).toContain('Inspect');
    expect(html).toContain('Graph (human)');
    expect(html).toContain('Agent context');

    expect(html).not.toContain('Ontology workbench');
    expect(html).not.toContain('Evidence strip');
    expect(html).not.toContain('data-testid="capsule-workbench-human-graph"');
    expect(html).not.toContain('data-testid="capsule-workbench-agent-context"');
  });

  it('wires category inspection to the existing depth surfaces instead of duplicating them', () => {
    const panelSource = readSource('src/components/capsules/CapsuleWorkbenchPanel.tsx');
    const drawerSource = readSource('src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx');
    const dockSource = readSource('src/components/app/ask-context-bar.tsx');

    expect(panelSource).toContain('const [inspectedCategory, setInspectedCategory]');
    expect(panelSource).toContain('data-testid={`capsule-category-chip-${category.id}`}');
    expect(panelSource).toContain('setInspectedCategory(category.id)');
    expect(panelSource).toContain('data-testid="capsule-inspection-depth"');
    expect(panelSource).toContain('CapsuleOntologyWorkbench');
    expect(panelSource).toContain('CapsuleAgentView');
    expect(panelSource).toContain('inspectionCategory={inspectedCategory}');

    expect(drawerSource).toContain('inspectionCategory');
    expect(drawerSource).toContain('categoryToTab');
    expect(drawerSource).toContain('useState(Boolean(inspectionCategory))');

    expect(dockSource).toContain('getCapsuleCategoryPalette(slot.kind)');
  });
});

function readSource(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

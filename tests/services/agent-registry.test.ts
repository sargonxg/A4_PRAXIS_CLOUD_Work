import { describe, it, expect } from 'vitest';
import {
  AGENT_REGISTRY,
  DEFAULT_BRAINSTORMING_PANEL,
  activePersonas,
  criticPersonas,
  getPersona,
} from '@/lib/agents/registry';

describe('agent registry', () => {
  it('every entry has matching id, label, rolePrompt, frameworks', () => {
    for (const [id, persona] of Object.entries(AGENT_REGISTRY)) {
      expect(persona.id).toBe(id);
      expect(persona.label.length).toBeGreaterThan(0);
      expect(persona.rolePrompt.length).toBeGreaterThan(20);
      expect(persona.frameworks.length).toBeGreaterThan(0);
    }
  });

  it('default brainstorming panel members are all active', () => {
    for (const id of DEFAULT_BRAINSTORMING_PANEL) {
      const p = getPersona(id);
      expect(p, `panel member ${id} must resolve`).not.toBeNull();
      expect(p!.active).toBe(true);
    }
  });

  it('default panel includes at least one critic', () => {
    const critics = DEFAULT_BRAINSTORMING_PANEL.filter((id) => AGENT_REGISTRY[id].critic);
    expect(critics.length).toBeGreaterThanOrEqual(1);
  });

  it('activePersonas returns at least the six default panel members', () => {
    const active = activePersonas();
    expect(active.length).toBeGreaterThanOrEqual(DEFAULT_BRAINSTORMING_PANEL.length);
    for (const id of DEFAULT_BRAINSTORMING_PANEL) {
      expect(active.find((p) => p.id === id)).toBeTruthy();
    }
  });

  it('criticPersonas returns only critics', () => {
    const critics = criticPersonas();
    for (const c of critics) {
      expect(c.critic).toBe(true);
      expect(c.active).toBe(true);
    }
  });

  it('getPersona returns null for unknown ids', () => {
    expect(getPersona('martian')).toBeNull();
  });

  it('getPersona returns null for inactive personas (stubs)', () => {
    // source-scout is registered but not yet wired — must read as inactive.
    expect(getPersona('source-scout')).toBeNull();
  });

  it('every active persona either has handoffTools or is the synthesis chair', () => {
    for (const p of activePersonas()) {
      if (p.id === 'synthesis-chair') continue;
      expect(p.handoffTools, `${p.id} must declare handoff tools`).toBeDefined();
      expect(p.handoffTools!.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from 'vitest';
import {
  rationaleForIdentity,
  rationaleForPerspective,
  rationaleForWorkingStyle,
  __test__,
} from '@/lib/onboarding/rationale';

describe('rationaleForIdentity', () => {
  it('returns role-specific rationale for un_official', () => {
    const r = rationaleForIdentity('un_official', 'senior');
    expect(r.headline).toMatch(/UN editorial standards/);
    expect(r.bullets.length).toBeGreaterThanOrEqual(3);
    expect(r.example.tool).toBeTruthy();
    expect(r.example.outcome).toBeTruthy();
  });

  it('returns role-specific rationale for diplomat / mediator / analyst / researcher / observer / advisor', () => {
    for (const role of ['diplomat', 'mediator', 'analyst', 'researcher', 'observer', 'advisor']) {
      const r = rationaleForIdentity(role);
      expect(r.headline.length).toBeGreaterThan(20);
      expect(r.bullets.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('falls back to a generic rationale on unknown role', () => {
    const r = rationaleForIdentity('martian');
    expect(r.headline).toMatch(/calibrates every tool/);
    expect(r.bullets.length).toBeGreaterThanOrEqual(3);
  });

  it('includes a named PRAXIS tool in every example', () => {
    for (const role of Object.keys(__test__.IDENTITY_BY_ROLE)) {
      const r = rationaleForIdentity(role);
      expect(r.example.tool).toBeTruthy();
      expect(r.example.outcome.length).toBeGreaterThan(10);
    }
  });
});

describe('rationaleForPerspective', () => {
  it('returns domain-specific rationale for humanitarian', () => {
    const r = rationaleForPerspective('humanitarian');
    expect(r.headline).toMatch(/Humanitarian/);
    expect(r.example.tool).toBe('Humanitarian');
  });

  it('returns domain-specific rationale for armed-conflict-security', () => {
    const r = rationaleForPerspective('armed-conflict-security');
    expect(r.headline.toLowerCase()).toMatch(/armed conflict/);
    expect(r.example.tool).toBe('Early Warning');
  });

  it('falls back to a generic rationale on unknown domain', () => {
    const r = rationaleForPerspective('martian-policy');
    expect(r.headline).toMatch(/domain defaults shape/);
  });

  it('returns a non-empty rationale for every domain in the registry', () => {
    for (const domain of Object.keys(__test__.PERSPECTIVE_BY_DOMAIN)) {
      const r = rationaleForPerspective(domain);
      expect(r.bullets.length).toBeGreaterThan(0);
      expect(r.example.tool).toBeTruthy();
    }
  });
});

describe('rationaleForWorkingStyle', () => {
  it('returns French copy for fr', () => {
    const r = rationaleForWorkingStyle('fr');
    expect(r.headline).toMatch(/français/);
  });

  it('returns Arabic copy for ar', () => {
    const r = rationaleForWorkingStyle('ar');
    expect(r.headline).toMatch(/العربية/);
  });

  it('returns Spanish copy for es', () => {
    const r = rationaleForWorkingStyle('es');
    expect(r.headline).toMatch(/español/);
  });

  it('falls back to English-default for en or unknown', () => {
    const r = rationaleForWorkingStyle('en');
    expect(r.headline).toMatch(/Working style/);
    const r2 = rationaleForWorkingStyle('xx');
    expect(r2.headline).toMatch(/Working style/);
  });
});

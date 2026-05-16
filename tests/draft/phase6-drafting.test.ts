import { describe, expect, it } from 'vitest';
import { DRAFTING_TEMPLATES, getDraftTemplate } from '@/lib/draft/api';

const expectedTemplateIds = [
  'un-1-pager',
  'country-card',
  'talking-points',
  'mediation-brief',
  'executive-summary',
];

describe('Phase 6 drafting templates', () => {
  it('registers the five MVP templates as generation-ready shells', () => {
    expect(DRAFTING_TEMPLATES.map((template) => template.id)).toEqual(expectedTemplateIds);

    for (const template of DRAFTING_TEMPLATES) {
      expect(template.phase).toBe('phase-6-generation');
      expect(template.header).toContain('PRAXIS');
      expect(template.footer.length).toBeGreaterThan(10);
      expect(template.sections.length).toBeGreaterThanOrEqual(5);
      expect(template.sections.some((section) => section.citationPolicy === 'required')).toBe(true);
    }
  });

  it('keeps every section structured for section-level actions', () => {
    for (const templateId of expectedTemplateIds) {
      const template = getDraftTemplate(templateId);

      for (const section of template.sections) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.prompt.length).toBeGreaterThan(10);
        expect(section.maxLength).toBeGreaterThan(0);
        expect(['required', 'recommended', 'optional']).toContain(section.citationPolicy);
      }
    }
  });
});

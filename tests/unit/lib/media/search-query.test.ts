import { describe, expect, it } from 'vitest';
import {
  buildAdvancedMediaSearchQuery,
  buildSituationMediaKeywords,
} from '@/lib/media/search-query';

describe('buildAdvancedMediaSearchQuery', () => {
  it('builds reproducible advanced search operators', () => {
    const query = buildAdvancedMediaSearchQuery({
      keywords: ['Sudan', 'RSF', 'SAF'],
      exactPhrases: ['humanitarian access'],
      excludeTerms: ['football'],
      domains: ['news.un.org', 'reliefweb.int'],
      since: '2026-04-25',
      until: '2026-04-26',
      language: 'en',
    });

    expect(query).toBe(
      '(Sudan OR RSF OR SAF) "humanitarian access" (site:news.un.org OR site:reliefweb.int) after:2026-04-25 before:2026-04-26 lang:en -"football"',
    );
  });

  it('drops empty terms without changing operator order', () => {
    const query = buildAdvancedMediaSearchQuery({
      keywords: ['  User Case ', ''],
      exactPhrases: ['  ceasefire   violation  '],
      excludeTerms: [''],
    });

    expect(query).toBe('(User Case) "ceasefire violation"');
  });
});

describe('buildSituationMediaKeywords', () => {
  it('combines situation name, region, and actors', () => {
    expect(buildSituationMediaKeywords({
      name: 'User Case Crisis',
      region: 'Eastern Provinces',
      actors: ['AFN', 'DRM'],
    })).toEqual(['User Case Crisis', 'Eastern Provinces', 'AFN', 'DRM']);
  });
});

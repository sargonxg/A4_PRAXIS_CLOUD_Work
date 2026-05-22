import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiSettingsSchema } from '@/lib/api/schemas';
import {
  buildEventTimelineBigQueryTemplate,
  normalizeGdeltDocResponse,
  normalizeWikidataEntityResponse,
  rejectRawResearchGraphQuery,
  runResearchGraphSearch,
  validateBigQueryEventTimeline,
} from '@/lib/research-graph';

describe('research graph capability', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults the per-turn ai setting off while accepting the explicit toggle', () => {
    expect(aiSettingsSchema.parse(undefined)).toBeUndefined();
    expect((aiSettingsSchema.parse({}) ?? {}).researchGraphExtra).toBe(false);
    expect(aiSettingsSchema.parse({ researchGraphExtra: true })).toMatchObject({
      researchGraphExtra: true,
    });
  });

  it('returns a blocked advisory receipt when the server flag is disabled or the user is sample mode', async () => {
    await expect(runResearchGraphSearch({
      queryKind: 'current_media_pulse',
      topic: 'Sudan ceasefire talks',
      env: {},
      actor: { isDemo: false, tier: 'free' },
    })).resolves.toMatchObject({
      advisoryOnly: true,
      status: 'blocked',
      blockedReason: 'server_disabled',
      costPosture: 'free_open_data',
    });

    await expect(runResearchGraphSearch({
      queryKind: 'current_media_pulse',
      topic: 'Sudan ceasefire talks',
      env: { RESEARCH_GRAPH_ENABLED: 'true' },
      actor: { isDemo: true, tier: 'enterprise' },
    })).resolves.toMatchObject({
      advisoryOnly: true,
      status: 'blocked',
      blockedReason: 'sample_mode_disabled',
    });
  });

  it('normalizes GDELT DOC/API article and timeline responses into advisory receipts', () => {
    const receipt = normalizeGdeltDocResponse({
      queryKind: 'current_media_pulse',
      filters: { topic: 'Red Sea shipping', maxResults: 2 },
      articleList: {
        articles: [
          {
            title: 'Shipping disruption update',
            url: 'https://example.org/shipping',
            domain: 'example.org',
            seendate: '20260521T120000Z',
            sourcecountry: 'US',
            language: 'English',
          },
        ],
      },
      timeline: {
        timeline: [
          { date: '20260520', value: 7 },
          { date: '20260521', value: 11 },
        ],
      },
      generatedAt: '2026-05-22T12:00:00.000Z',
    });

    expect(receipt).toMatchObject({
      provider: 'gdelt-doc',
      queryKind: 'current_media_pulse',
      advisoryOnly: true,
      status: 'ready',
      sourceUrls: ['https://example.org/shipping'],
      mediaSeries: [
        { date: '2026-05-20', value: 7 },
        { date: '2026-05-21', value: 11 },
      ],
      costPosture: 'free_open_data',
    });
  });

  it('normalizes Wikidata SPARQL bindings into entity grounding receipts', () => {
    const receipt = normalizeWikidataEntityResponse({
      search: 'United Nations',
      bindings: [
        {
          item: { value: 'http://www.wikidata.org/entity/Q1065' },
          itemLabel: { value: 'United Nations' },
          itemDescription: { value: 'intergovernmental organization' },
          altLabel: { value: 'UN' },
          countryLabel: { value: 'United States' },
          officialWebsite: { value: 'https://www.un.org/' },
          viaf: { value: '144742465' },
        },
      ],
      generatedAt: '2026-05-22T12:00:00.000Z',
    });

    expect(receipt.entityMatches[0]).toMatchObject({
      qid: 'Q1065',
      label: 'United Nations',
      aliases: ['UN'],
      externalIds: { VIAF: '144742465' },
      officialSite: 'https://www.un.org/',
    });
    expect(receipt.citations[0]).toContain('query.wikidata.org');
  });

  it('rejects raw SQL and SPARQL while allowing only bounded templates', () => {
    expect(() => rejectRawResearchGraphQuery({ sparql: 'SELECT * WHERE { ?s ?p ?o }' })).toThrow(/raw/i);
    expect(() => rejectRawResearchGraphQuery({ sql: 'SELECT * FROM gdelt-bq.gdeltv2.events' })).toThrow(/raw/i);

    expect(validateBigQueryEventTimeline({
      startDate: '2026-05-01',
      endDate: '2026-05-22',
      filter: 'Sudan',
      limit: 50,
      env: {
        GDELT_BIGQUERY_ENABLED: 'true',
        RESEARCH_GRAPH_MAX_BYTES_BILLED: '100000000',
      },
      dryRunEstimateBytes: 20_000_000,
    })).toMatchObject({ ok: true });

    expect(validateBigQueryEventTimeline({
      startDate: '2026-05-01',
      endDate: '2026-05-22',
      filter: 'Sudan',
      limit: 50,
      env: {
        GDELT_BIGQUERY_ENABLED: 'true',
        RESEARCH_GRAPH_MAX_BYTES_BILLED: '1000000',
      },
      dryRunEstimateBytes: 20_000_000,
    })).toMatchObject({ ok: false, blockedReason: 'dry_run_exceeds_cap' });

    expect(buildEventTimelineBigQueryTemplate({
      startDate: '2026-05-01',
      endDate: '2026-05-22',
      filter: 'Sudan',
      limit: 50,
    }).sql).not.toContain('SELECT *');
  });
});

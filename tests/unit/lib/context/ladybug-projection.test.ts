import { describe, expect, it } from 'vitest';
import { buildLadybugProjectionFromGraphJsonLd } from '@/lib/context/ladybug-projection';

const graphJsonLd = {
  '@context': {
    dialectica: 'https://tacitus.me/dialectica#',
    prov: 'http://www.w3.org/ns/prov#',
    g: 'urn:praxis:graph:',
  },
  '@graph': [
    {
      '@id': 'g:situation',
      '@graph': [
        {
          '@id': 'ent_regional_army_command',
          '@type': 'dialectica:Actor',
          'dialectica:title': 'Regional Army Command',
          'dialectica:contendsWith': 'ent_election_commission',
        },
        {
          '@id': 'ent_election_commission',
          '@type': 'dialectica:Institution',
          'dialectica:title': 'Election Commission',
        },
      ],
    },
    {
      '@id': 'g:claims',
      '@graph': [
        {
          '@id': 'clm_army_rejects_certification',
          '@type': 'dialectica:Claim',
          'dialectica:title': 'Army rejects certification',
          'dialectica:trustLayer': 'T2',
          'dialectica:source': 'src_commission_statement',
          'dialectica:target': 'ent_regional_army_command',
        },
      ],
    },
    {
      '@id': 'g:evidence',
      '@graph': [
        {
          '@id': 'src_commission_statement',
          '@type': 'prov:Entity',
          'dialectica:title': 'Election Commission Certification Statement',
        },
      ],
    },
  ],
};

describe('Ladybug advisory projection builder', () => {
  it('deterministically rebuilds advisory nodes and edges from graph.jsonld', () => {
    const first = buildLadybugProjectionFromGraphJsonLd(graphJsonLd, {
      capsuleId: 'cap_fixture',
    });
    const second = buildLadybugProjectionFromGraphJsonLd(graphJsonLd, {
      capsuleId: 'cap_fixture',
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      provider: 'graphlite',
      projectionId: 'dialectica-cap_fixture-ladybug-jsonld',
      status: 'compiled-advisory',
      advisoryOnly: true,
      source: 'dialectica:graph.jsonld',
      derivedFrom: ['dialectica:graph.jsonld'],
      nodeCount: 4,
      edgeCount: 2,
    });
    expect(first.nodes.map((node) => node.id)).toEqual([
      'clm_army_rejects_certification',
      'ent_election_commission',
      'ent_regional_army_command',
      'src_commission_statement',
    ]);
    expect(first.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'clm_army_rejects_certification',
        entityType: 'Claim',
        primitive: 'Claim',
        reviewState: 'advisory',
        confidence: 0.75,
        sourceReceiptIds: ['src_commission_statement'],
        derivedFrom: ['clm_army_rejects_certification'],
      }),
      expect.objectContaining({
        id: 'ent_regional_army_command',
        entityType: 'Actor',
        primitive: 'Actor',
        reviewState: 'advisory',
      }),
    ]));
    expect(first.edges).toEqual([
      expect.objectContaining({
        source: 'clm_army_rejects_certification',
        target: 'ent_regional_army_command',
        relationshipType: 'target',
        reviewState: 'advisory',
        sourceReceiptIds: ['src_commission_statement'],
        derivedFrom: ['clm_army_rejects_certification:dialectica:target:ent_regional_army_command'],
      }),
      expect.objectContaining({
        source: 'ent_regional_army_command',
        target: 'ent_election_commission',
        relationshipType: 'contends_with',
        reviewState: 'advisory',
        derivedFrom: ['ent_regional_army_command:dialectica:contendsWith:ent_election_commission'],
      }),
    ]);
  });
});

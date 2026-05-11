import type { CaseModule } from '@/types/case-module';
import type { ContextEpisode } from '@/types/episode';

export function buildContextEpisodes(caseModule: CaseModule): ContextEpisode[] {
  if (caseModule.episodes?.length) return caseModule.episodes;

  const updated = caseModule.situation.updatedAt || new Date().toISOString();
  return [
    {
      id: `${caseModule.id}-situation-open`,
      caseId: caseModule.id,
      episodeId: 'situation-open',
      ownerUid: 'demo-or-owner',
      strand: 'situation',
      episodeType: 'context-frame',
      title: 'Context opened',
      validFrom: caseModule.situation.createdAt || updated,
      metadata: { source: 'context-shell' },
    },
    {
      id: `${caseModule.id}-work-current`,
      caseId: caseModule.id,
      episodeId: 'work-current',
      ownerUid: 'demo-or-owner',
      strand: 'work',
      episodeType: 'analysis-cycle',
      title: 'Current analysis cycle',
      validFrom: updated,
      metadata: { source: 'context-shell' },
    },
  ];
}

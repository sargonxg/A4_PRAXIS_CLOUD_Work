import { describe, expect, it } from 'vitest';
import { buildBoardroomDeliberation } from '@/lib/boardroom/deterministic-boardroom';
import { boardroomExportFilename, renderBoardroomDocxBuffer, renderBoardroomMarkdown } from '@/lib/boardroom/export';

describe('boardroom export', () => {
  const deliberation = buildBoardroomDeliberation({
    id: 'export-1',
    caseId: 'case-1',
    ownerUid: 'u1',
    now: '2026-05-06T12:00:00.000Z',
    config: {
      question: 'How should the mediation team sequence the next engagement?',
      satIntegration: { redTeamRound: true, achScoring: true, kacAnnex: false, premortemRound: false },
    },
  });

  it('renders a markdown export with synthesis, dissent, and handling note', () => {
    const markdown = renderBoardroomMarkdown(deliberation);

    expect(markdown).toContain('# Boardroom - How should the mediation team sequence the next engagement?');
    expect(markdown).toContain('## Consensus Claims');
    expect(markdown).toContain('## Dissenting Views');
    expect(markdown).toContain('Boardroom output is synthesized and advisory');
  });

  it('renders a non-empty DOCX buffer', async () => {
    const buffer = await renderBoardroomDocxBuffer(deliberation);

    expect(buffer.byteLength).toBeGreaterThan(1000);
    expect(boardroomExportFilename(deliberation, 'docx')).toMatch(/\.docx$/);
  });
});

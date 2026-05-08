import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { DeliberationArtifact, DeliberationSynthesis } from '@/types/boardroom';

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'praxis-boardroom';
}

function paragraph(text: string) {
  return new Paragraph({
    spacing: { after: 140, line: 300 },
    children: [new TextRun({ text, font: 'Inter', size: 22 })],
  });
}

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: 'Aptos Display', size: 28, bold: true, color: '10233F' })],
  });
}

function meta(text: string) {
  return new Paragraph({
    spacing: { after: 70 },
    children: [new TextRun({ text, font: 'Aptos', size: 18, color: '667085' })],
  });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D5DD' } },
    spacing: { before: 160, after: 180 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: 'Inter', size: 21 })],
  });
}

function uniqueCitationLabels(deliberation: DeliberationArtifact) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const turn of deliberation.contributions) {
    for (const citation of turn.citations) {
      const label = citation.label.trim();
      if (!label || seen.has(label)) continue;
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}

function criticalClaims(deliberation: DeliberationArtifact) {
  return deliberation.synthesis?.consensusClaims?.length
    ? deliberation.synthesis.consensusClaims.map((claim) =>
      `${claim.text} Confidence: ${Math.round(claim.confidence * 100)}%. Synthesized: yes.`
    )
    : ['No critical claims or hypotheses were finalized in this deliberation.'];
}

function synthesisParagraphs(synthesis: DeliberationSynthesis | undefined) {
  if (!synthesis) return [paragraph('No synthesis has been produced yet.')];

  return [
    paragraph(synthesis.bluf),
    heading('Consensus Claims'),
    ...synthesis.consensusClaims.map((claim) =>
      bullet(`${claim.text} Confidence: ${Math.round(claim.confidence * 100)}%. Synthesized: yes.`)
    ),
    heading('Dissenting Views'),
    ...(synthesis.dissentingViews.length ? synthesis.dissentingViews.map(bullet) : [paragraph('No dissent recorded.')]),
    heading('Unresolved Questions'),
    ...(synthesis.unresolvedQuestions.length ? synthesis.unresolvedQuestions.map(bullet) : [paragraph('No unresolved questions recorded.')]),
    heading('Recommended Actions'),
    ...(synthesis.recommendedActions.length ? synthesis.recommendedActions.map(bullet) : [paragraph('No recommendations recorded.')]),
  ];
}

export function boardroomExportFilename(deliberation: DeliberationArtifact, extension: 'docx' | 'md') {
  return `${sanitizeFilename(deliberation.title)}.${extension}`;
}

export function renderBoardroomMarkdown(deliberation: DeliberationArtifact) {
  const citations = uniqueCitationLabels(deliberation);
  const lines = [
    `# ${deliberation.title}`,
    '',
    '## Title Slide',
    '',
    `Case: ${deliberation.caseId}`,
    `Status: ${deliberation.status}`,
    `Phase: ${deliberation.phase}`,
    `Cost estimate: $${deliberation.cost.estimatedUsd.toFixed(3)} / $${deliberation.cost.ceilingUsd.toFixed(2)}`,
    `Exported: ${new Date().toISOString()}`,
    `Visuals: maps/charts are included when the deliberation artifact carries visual attachments; none were attached to this export.`,
    '',
    '## Synthesis',
    '',
    deliberation.synthesis?.bluf ?? 'No synthesis has been produced yet.',
    '',
    '## Critical Claims And Hypotheses',
    '',
    '## Consensus Claims',
    '',
    ...criticalClaims(deliberation).map((claim) => `- ${claim}`),
    '',
    '## Dissenting Views',
    '',
    ...(deliberation.synthesis?.dissentingViews.map((view) => `- ${view}`) ?? ['- No dissent recorded.']),
    '',
    '## Q&A Prep',
    '',
    ...(deliberation.synthesis?.unresolvedQuestions.map((question) => `- Likely question: ${question}`) ?? ['- No unresolved questions recorded.']),
    ...(deliberation.synthesis?.recommendedActions.map((action) => `- Prepared answer/action: ${action}`) ?? ['- No recommended actions recorded.']),
    '',
    '## Transcript',
    '',
    ...deliberation.contributions.flatMap((turn) => [
      `### ${turn.personaName} - ${turn.phase}`,
      '',
      turn.text,
      '',
      `Citations: ${turn.citations.map((citation) => citation.label).join('; ')}`,
      '',
    ]),
    '## Sources Appendix',
    '',
    ...(citations.length ? citations.map((label, index) => `[${index + 1}] ${label}`) : ['[1] No citations were attached to this deliberation.']),
    '',
    '## Handling Note',
    '',
    'Boardroom output is synthesized and advisory. Promote selected claims through the PRAXIS review queue before treating them as graph assertions.',
    '',
  ];

  return lines.join('\n');
}

export async function renderBoardroomDocxBuffer(deliberation: DeliberationArtifact): Promise<Buffer> {
  const citations = uniqueCitationLabels(deliberation);
  const doc = new Document({
    creator: 'PRAXIS',
    description: 'PRAXIS Agentic Boardroom deliberation export',
    title: deliberation.title,
    styles: {
      default: {
        document: {
          run: { font: 'Inter', size: 22 },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 560, after: 120 },
          children: [new TextRun({ text: 'TACITUS PRAXIS', font: 'Aptos Display', size: 22, bold: true, color: '475467' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: 'AGENTIC BOARDROOM', font: 'Aptos Display', size: 26, bold: true, color: '1D4ED8' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: deliberation.title, font: 'Aptos Display', size: 34, bold: true, color: '101828' })],
        }),
        meta(`Case: ${deliberation.caseId}`),
        meta(`Status: ${deliberation.status} | Phase: ${deliberation.phase}`),
        meta(`Cost estimate: $${deliberation.cost.estimatedUsd.toFixed(3)} / $${deliberation.cost.ceilingUsd.toFixed(2)}`),
        meta(`Exported: ${new Date().toISOString()}`),
        meta('Visuals: maps/charts are included when deliberation artifacts carry visual attachments; none were attached to this export.'),
        divider(),
        heading('Synthesis'),
        ...synthesisParagraphs(deliberation.synthesis),
        divider(),
        heading('Critical Claims And Hypotheses'),
        heading('Consensus Claims'),
        ...criticalClaims(deliberation).map(bullet),
        heading('Q&A Prep'),
        ...(deliberation.synthesis?.unresolvedQuestions.length
          ? deliberation.synthesis.unresolvedQuestions.map((question) => bullet(`Likely question: ${question}`))
          : [paragraph('No unresolved questions recorded.')]),
        ...(deliberation.synthesis?.recommendedActions.length
          ? deliberation.synthesis.recommendedActions.map((action) => bullet(`Prepared answer/action: ${action}`))
          : [paragraph('No recommended actions recorded.')]),
        divider(),
        heading('Transcript'),
        ...deliberation.contributions.flatMap((turn) => [
          heading(`${turn.personaName} - ${turn.phase}`),
          paragraph(turn.text),
          meta(`Citations: ${turn.citations.map((citation) => citation.label).join('; ')}`),
        ]),
        divider(),
        heading('Sources Appendix'),
        ...(citations.length
          ? citations.map((label, index) => paragraph(`[${index + 1}] ${label}`))
          : [paragraph('[1] No citations were attached to this deliberation.')]),
        divider(),
        heading('Handling Note'),
        paragraph('Boardroom output is synthesized and advisory. Promote selected claims through the PRAXIS review queue before treating them as graph assertions.'),
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

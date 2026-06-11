import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCapsuleQualityRankingReport,
  type CapsuleQualityRankingItem,
} from '../src/lib/product/capsule-quality-ranking';

const root = process.cwd();
const weakestCount = 20;
const report = buildCapsuleQualityRankingReport({ weakestCount });
const auditDir = join(root, 'docs', 'audits');
const jsonPath = join(auditDir, 'LATEST-capsule-quality-ranking.json');
const mdPath = join(auditDir, 'LATEST-capsule-quality-ranking.md');

mkdirSync(auditDir, { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(toPersistedReport(report), null, 2)}\n`);
writeFileSync(mdPath, renderMarkdown(report));

if (report.weakest.length !== weakestCount) {
  console.error(`audit:capsule-quality-ranking expected ${weakestCount} weakest capsules, found ${report.weakest.length}`);
  process.exit(1);
}

if (report.summary.reviewProposalCount < weakestCount) {
  console.error(`audit:capsule-quality-ranking expected at least one review proposal per weakest capsule, found ${report.summary.reviewProposalCount}`);
  process.exit(1);
}

console.log(`audit:capsule-quality-ranking OK (${report.total} starters; weakest ${report.weakest.length}; review proposals ${report.summary.reviewProposalCount})`);

function toPersistedReport(report: ReturnType<typeof buildCapsuleQualityRankingReport>) {
  return {
    generatedAt: report.generatedAt,
    catalogVersion: report.catalogVersion,
    total: report.total,
    weakestCount: report.weakestCount,
    summary: report.summary,
    ranked: report.ranked.map((item) => ({
      rank: item.rank,
      starterId: item.starterId,
      label: item.label,
      category: item.category,
      domain: item.domain,
      score: item.score,
      weakestSignals: item.weakestSignals,
      reviewProposalTargets: item.reviewProposalTargets,
    })),
    weakest: report.weakest,
  };
}

function renderMarkdown(report: ReturnType<typeof buildCapsuleQualityRankingReport>): string {
  return [
    '# Capsule Quality Ranking',
    '',
    '- Output: rolling LATEST file',
    `- Catalog version: ${report.catalogVersion}`,
    `- Generated at: ${report.generatedAt}`,
    `- Starters ranked: ${report.total}`,
    `- Weakest set: ${report.weakest.length}`,
    `- Score range: ${report.summary.minimumScore} - ${report.summary.maximumScore}; average ${report.summary.averageScore}`,
    `- Review proposals for weakest set: ${report.summary.reviewProposalCount}`,
    '',
    '## Weakest 20',
    '',
    '| Rank | Score | Capsule | Type | Domain | Sources | Claims | Graph | Review targets | Signals |',
    '| ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.weakest.map(renderWeakestRow),
    '',
    '## Review Proposal Target Counts',
    '',
    ...renderCounts(report.summary.reviewProposalTargetCounts),
    '',
    '## Weakest Signal Counts',
    '',
    ...renderCounts(report.summary.weakestSignalCounts),
    '',
    '## Use',
    '',
    'Use this report as the P1 selection queue. The generated review proposals are deliberately `proposed` only; do not mutate starter definitions until a human review-card path accepts the source-spine, claim-ledger, tacit-knowledge, or embedded-graph repair.',
    '',
  ].join('\n');
}

function renderWeakestRow(item: CapsuleQualityRankingItem): string {
  return [
    item.rank,
    item.score,
    mdCell(`${item.label} (${item.starterId})`),
    item.category,
    item.domain,
    `${item.sourceCount}/${item.dossierSourceCount}; ext ${percent(item.externalSourceRatio)}; fresh ${percent(item.freshSourceRatio)}`,
    `supported ${item.supportedClaimCount}; weak ${item.weakClaimCount}; missing ${item.missingClaimCount}; stale ${item.staleClaimCount}`,
    `${item.graphNodeCount}n/${item.graphEdgeCount}e`,
    mdCell(item.reviewProposalTargets.join(', ') || 'none'),
    mdCell(item.weakestSignals.join(', ')),
  ].join(' | ').replace(/^/, '| ').replace(/$/, ' |');
}

function renderCounts(counts: Record<string, number>): string[] {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries.length ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- None'];
}

function mdCell(value: string): string {
  return value.replace(/\|/g, '/');
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

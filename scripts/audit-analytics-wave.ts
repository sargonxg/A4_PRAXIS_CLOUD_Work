import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

const requiredFiles = [
  'backend/services/analytics/network_metrics.py',
  'backend/services/analytics/firewall_metrics_writer.py',
  'backend/services/sanctions/yente_client.py',
  'backend/services/sanctions/sync_index.py',
  'backend/migrations/versions/0012_graph_nodes_metrics.py',
  'services/sanctions-yente/Dockerfile',
  'services/sanctions-yente/cloudbuild.yaml',
  'services/simulate-policy-abm/main.py',
  'services/simulate-policy-abm/scenarios/escalation_ladder_with_mediator.py',
  'services/simulate-policy-abm/cloudbuild.yaml',
  'infrastructure/terraform/modules/sanctions-yente/main.tf',
  'infrastructure/terraform/modules/sanctions-opensearch/main.tf',
  'infrastructure/terraform/modules/simulate-policy-abm/main.tf',
  'skills/tools/analyze.network/SKILL.md',
  'skills/tools/match.sanctions/SKILL.md',
  'skills/tools/simulate.policy_abm/SKILL.md',
  'docs/adr/0048-analytics-sanctions-simulation-as-cross-cutting-tools.md',
  'docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md',
  'docs/runbooks/SANCTIONS_DATA_LICENSING.md',
  'docs/codex-prompts/PRAXIS_CODEX_31_ANALYTICS_SANCTIONS_SIMULATION_WAVE.md',
];

const failures: string[] = [];
for (const file of requiredFiles) {
  if (!existsSync(join(process.cwd(), file))) failures.push(`missing ${file}`);
}

for (const id of ['analyze.network', 'match.sanctions', 'simulate.policy_abm']) {
  const tool = MARKETPLACE_TOOLS.find((item) => item.id === id);
  if (!tool) failures.push(`marketplace missing ${id}`);
  if (tool && tool.category !== 'cross') failures.push(`${id} must use existing cross category`);
}

if (MARKETPLACE_TOOLS.length !== 57) failures.push(`expected 57 marketplace tools after Pack 31, found ${MARKETPLACE_TOOLS.length}`);

const networkMetrics = read('backend/services/analytics/network_metrics.py');
for (const marker of ['betweenness_centrality', 'eigenvector_centrality', 'pagerank', 'louvain']) {
  if (!networkMetrics.includes(marker)) failures.push(`network metrics missing ${marker}`);
}

const migration = read('backend/migrations/versions/0012_graph_nodes_metrics.py');
if (!migration.includes('metrics jsonb')) failures.push('migration must add graph_nodes.metrics jsonb');

const abm = read('services/simulate-policy-abm/scenarios/escalation_ladder_with_mediator.py');
if (!abm.includes('scenario stress-test')) failures.push('ABM output must use scenario stress-test framing');

const abmCloudbuild = read('services/simulate-policy-abm/cloudbuild.yaml');
if (!abmCloudbuild.includes('/praxis/simulate-policy-abm')) failures.push('ABM worker image must use the existing praxis Artifact Registry repository');
if (!abmCloudbuild.includes('--no-allow-unauthenticated')) failures.push('ABM worker must deploy without public unauthenticated access');

const yenteClient = read('backend/services/sanctions/yente_client.py');
if (!yenteClient.includes('build_owner_scoped_actor_metadata_update') || !yenteClient.includes('owner-scoped-actor-metadata-only')) {
  failures.push('sanctions yente client must expose owner-scoped Actor metadata persistence payload');
}

const graphEntityPanel = read('src/components/graph/GraphEntityPanel.tsx');
if (!graphEntityPanel.includes('graph-sanctions-badge') || !graphEntityPanel.includes('OpenSanctions')) {
  failures.push('active Pack 29 graph entity panel must render Pack 31 sanctions matches');
}

const workbenchGraph = read('src/lib/graph/workbench-case-graph.ts');
if (!workbenchGraph.includes('WorkbenchGraphSanctionsMatch') || !workbenchGraph.includes('metadata?:')) {
  failures.push('WorkbenchGraphNode must carry optional sanctions metadata for entity-panel rendering');
}

if (failures.length > 0) {
  console.error('Pack 31 analytics wave audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Pack 31 analytics wave audit passed for 57 marketplace tools. (static-marker)');

function read(file: string) {
  const path = join(process.cwd(), file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

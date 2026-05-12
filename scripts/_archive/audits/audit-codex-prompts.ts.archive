import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'docs/codex-prompts/PRAXIS_CODEX_00_MASTER_CHARTER.md',
  'docs/codex-prompts/PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md',
  'docs/codex-prompts/PRAXIS_CODEX_04_LANDING_AND_ENTRY_REBUILD.md',
  'docs/codex-prompts/PRAXIS_CODEX_05_CONTEXT_VS_TOOLS_SEPARATION.md',
  'docs/codex-prompts/PRAXIS_CODEX_06_ONTOLOGY_SYSTEM.md',
  'docs/codex-prompts/PRAXIS_CODEX_07_GRAPH_VISUALIZATION.md',
  'docs/codex-prompts/PRAXIS_CODEX_08_TOOLS_MARKETPLACE.md',
  'docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md',
  'docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md',
  'docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md',
  'docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md',
  'docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md',
  'docs/codex-prompts/PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md',
  'docs/codex-prompts/PRAXIS_CODEX_15_SAT_TOOLKIT.md',
  'docs/codex-prompts/PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md',
  'docs/codex-prompts/PRAXIS_CODEX_18_PRODUCTION_REALITY_CLOSURE.md',
  'docs/codex-prompts/PRAXIS_CODEX_19_GENUINELY_USEFUL.md',
  'docs/codex-prompts/PRAXIS_CODEX_20_DYNAMIC_ONTOLOGIES.md',
  'docs/codex-prompts/PRAXIS_CODEX_21_MARKETPLACE_DEPTH.md',
  'docs/codex-prompts/PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md',
  'docs/codex-prompts/PRAXIS_CODEX_26_SURFACES_CHAPTERS_DESK_CONTEXT.md',
  'docs/codex-prompts/PRAXIS_CODEX_27_SURFACES_LIBRARY_RESEARCH_ONTOLOGY.md',
  'docs/codex-prompts/PRAXIS_CODEX_28_SURFACES_DRAFT_NEW_USER_AND_HARDENING.md',
  'docs/codex-prompts/PRAXIS_CODEX_29_VISUALIZATION_WAVE.md',
  'docs/codex-prompts/PRAXIS_CODEX_30_EXTRACTION_AND_GRAPHRAG_WAVE.md',
  'docs/codex-prompts/PRAXIS_CODEX_31_ANALYTICS_SANCTIONS_SIMULATION_WAVE.md',
  'docs/codex-prompts/PRAXIS_V2_00_README.md',
  'docs/codex-prompts/PRAXIS_V2_A0_MT_DATA_MODEL.md',
  'docs/codex-prompts/PRAXIS_V2_A1_ORGID_CONTEXT.md',
  'docs/codex-prompts/PRAXIS_V2_A2_COLLABORATORS_SCHEMA.md',
  'docs/codex-prompts/PRAXIS_V2_A3_FIRESTORE_RULES.md',
  'docs/codex-prompts/PRAXIS_V2_A4_TEAM_INVITE_FLOW.md',
  'docs/codex-prompts/PRAXIS_V2_A5_ROLE_PILLS_AND_GUARDS.md',
  'docs/codex-prompts/PRAXIS_V2_A6_MT_AUDIT_LOG.md',
  'docs/codex-prompts/PRAXIS_V2_B0_KG_PREFLIGHT.md',
  'docs/codex-prompts/PRAXIS_V2_B1_DUAL_WRITE_GRAPH.md',
  'docs/codex-prompts/PRAXIS_V2_B2_READ_PATH_POSTGRES.md',
  'docs/codex-prompts/PRAXIS_V2_B3_RETIRE_FIRESTORE_GRAPH.md',
  'docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md',
  'docs/codex-prompts/PRAXIS_V2_C1_MEMORY_RECALL_IN_CALIBRATION.md',
  'docs/codex-prompts/PRAXIS_V2_C2_AGENT_ENGINE_SUBAGENTS.md',
  'docs/codex-prompts/PRAXIS_V2_D0_STRUCTURED_EVENTS.md',
  'docs/codex-prompts/PRAXIS_V2_D1_KPI_PIPELINE.md',
  'docs/codex-prompts/PRAXIS_V2_Z1_EXPORT_E2E.md',
  'docs/codex-prompts/PRAXIS_V2_Z2_DEMO_TRANSITION.md',
  'docs/codex-prompts/PRAXIS_V2_Z3_DEEP_RESEARCH_CONSOLIDATE.md',
  'docs/codex-prompts/PRAXIS_V2_ITERATE_LOOP.md',
  'docs/codex-prompts/PRAXIS_V2_STATUS_TEMPLATE.md',
];

const failures: string[] = [];
for (const file of required) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  if (file.endsWith('PRAXIS_V2_ITERATE_LOOP.md')) {
    for (const marker of ['Pattern 1', 'Pattern 12', 'When NONE of the patterns apply']) {
      if (!text.includes(marker)) failures.push(`${file} missing recovery marker: ${marker}`);
    }
    continue;
  }
  if (file.endsWith('PRAXIS_V2_STATUS_TEMPLATE.md')) {
    for (const marker of ['Pending operational steps', 'Diagnostics log', 'Morning brief']) {
      if (!text.includes(marker)) failures.push(`${file} missing status-template marker: ${marker}`);
    }
    continue;
  }
  if (file.endsWith('PRAXIS_V2_Z1_EXPORT_E2E.md')) {
    for (const marker of ['Briefing', 'Boardroom', 'audit:export-coverage']) {
      if (!text.includes(marker)) failures.push(`${file} missing export-e2e marker: ${marker}`);
    }
    continue;
  }
  if (file.endsWith('PRAXIS_V2_Z2_DEMO_TRANSITION.md')) {
    for (const marker of ['copy-from-demo', 'audit:demo-claim', 'Use this case']) {
      if (!text.includes(marker)) failures.push(`${file} missing demo-transition marker: ${marker}`);
    }
    continue;
  }
  if (file.endsWith('PRAXIS_V2_Z3_DEEP_RESEARCH_CONSOLIDATE.md')) {
    for (const marker of ['deep-search-agent', 'deep-research', 'audit:deep-research-canonical']) {
      if (!text.includes(marker)) failures.push(`${file} missing deep-research marker: ${marker}`);
    }
    continue;
  }
  if ((!text.includes('PRAXIS') && !text.includes('V2_WORK_PACK')) || text.length < 5000) {
    failures.push(`${file} does not look like a complete pack prompt`);
  }
}

if (failures.length > 0) {
  console.error('Codex prompt pack audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Codex prompt pack audit passed for master charter, packs 03-16, packs 18-22, packs 26-31, PRAXIS V2 README, Session A prompts A0-A6, Session B prompts B0-B3, Session C prompts C0-C2, Session D prompts D0-D1, Session Z prompts Z1-Z3, and V2 control prompts ITERATE_LOOP/STATUS_TEMPLATE. (static-marker)');

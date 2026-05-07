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
];

const failures: string[] = [];
for (const file of required) {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) {
    failures.push(`missing ${file}`);
    continue;
  }
  const text = readFileSync(path, 'utf8');
  if (!text.includes('PRAXIS') || text.length < 5000) failures.push(`${file} does not look like a complete pack prompt`);
}

if (failures.length > 0) {
  console.error('Codex prompt pack audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Codex prompt pack audit passed for master charter, packs 03-16, packs 18-22, and packs 26-30.');

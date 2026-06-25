import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assessGoogleAgentPlatformReadiness, buildGoogleAgentPlatformManifest } from '../src/lib/google-agent-platform/readiness';

type CliMode = 'local' | 'predeploy' | 'production';

const root = process.cwd();
const mode: CliMode = process.argv.includes('--production')
  ? 'production'
  : process.argv.includes('--predeploy')
    ? 'predeploy'
    : 'local';
const env = { ...process.env };
if (mode === 'local' || mode === 'predeploy') {
  env.GOOGLE_CLOUD_PROJECT ||= 'praxisbytacitus';
  env.GOOGLE_CLOUD_LOCATION ||= 'us-central1';
  env.GOOGLE_VERTEX_LOCATION ||= 'us-central1';
}
const report = assessGoogleAgentPlatformReadiness({
  mode,
  env,
  files: {
    dataControllerAgent: existsSync(join(root, 'backend/agents/praxis_data_controller/agent.py')),
    runbook: existsSync(join(root, 'docs/runbooks/GOOGLE_AGENT_PLATFORM_FOR_PRAXIS.md')),
    adkBridge: existsSync(join(root, 'src/lib/agent-runtime/adk-bridge.ts')),
  },
});
const manifest = buildGoogleAgentPlatformManifest();

console.log(`Google Agent Platform readiness (${mode})`);
console.log(`Project: ${manifest.projectId}`);
console.log(`Region: ${manifest.region}`);
console.log(`Macro RAG repositories: ${manifest.ragRepositories.length}`);
for (const check of report.checks) {
  console.log(`${check.status.toUpperCase().padEnd(4)} ${check.label}: ${check.detail}`);
}

if (report.nextActions.length) {
  console.log('');
  console.log('Next actions:');
  for (const action of report.nextActions) console.log(`- ${action}`);
}

console.log('');
console.log(`Overall: ${report.overall.toUpperCase()}`);
if (report.overall === 'fail') process.exit(1);

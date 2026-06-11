import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  FORBIDDEN_MVP_INTEGRATION_CLAIMS,
  PRAXIS_POLICY_AGENTS,
  destinationHref,
} from '../src/lib/product/policy-agents';

const root = process.cwd();
const requiredFiles = [
  'src/components/praxis/tasklet-praxis-workbench.tsx',
  'src/components/cores/ContextBuilderRoom.tsx',
  'src/components/onboarding/welcome-modal.tsx',
  'src/lib/product/policy-agents.ts',
  'src/lib/agent-runtime/worker.ts',
] as const;

for (const file of requiredFiles) {
  const text = readFileSync(resolve(root, file), 'utf8');
  assert(text.trim().length > 0, `${file} is empty`);
}

const workbenchText = readFileSync(resolve(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
for (const marker of ['New capsule', 'Search capsules', 'Recent', 'Describe a task or responsibility', 'What can PRAXIS do for you?', 'policyAgentLoginHref']) {
  assert(workbenchText.includes(marker), `Tasklet workbench is missing marker: ${marker}`);
}
for (const forbidden of ['Policy sources, documents, grounded search', 'Recommended agent', 'Canonical user types', 'Suggested tools', 'Produce']) {
  assert(!workbenchText.includes(forbidden), `Tasklet workbench keeps dense marker: ${forbidden}`);
}

const redirectText = readFileSync(resolve(root, 'src/lib/auth/post-login-redirect.ts'), 'utf8');
assert(redirectText.includes("return '/app'"), 'Normal login should land on the one-page PRAXIS app');

const loginText = readFileSync(resolve(root, 'src/app/(auth)/login/page.tsx'), 'utf8');
for (const marker of ['PRAXIS run queued', 'Pick up the work where you left it.', 'Ask the question you need answered', 'PENDING_POLICY_AGENT_ID_KEY']) {
  assert(loginText.includes(marker), `Login handoff is missing marker: ${marker}`);
}

const welcomeText = readFileSync(resolve(root, 'src/components/onboarding/welcome-modal.tsx'), 'utf8');
for (const marker of ['Open PRAXIS Home', 'Add context', 'Ask PRAXIS', 'Open work']) {
  assert(welcomeText.includes(marker), `Welcome modal is missing Tasklet-style marker: ${marker}`);
}

for (const agent of PRAXIS_POLICY_AGENTS) {
  assert(destinationHref(agent.outputDestination) === '/app', `${agent.id} must route to the one-page app destination`);
  assert(agent.requiredCores.length > 0, `${agent.id} has no required capsule cores`);
}

const liveAgentText = PRAXIS_POLICY_AGENTS
  .filter((agent) => agent.readiness === 'live' || agent.readiness === 'queued')
  .map((agent) => `${agent.label} ${agent.description} ${agent.inputTypes.join(' ')}`)
  .join(' ')
  .toLowerCase();

for (const claim of FORBIDDEN_MVP_INTEGRATION_CLAIMS) {
  assert(!liveAgentText.includes(claim), `Live MVP policy agent exposes deferred claim: ${claim}`);
}

const workerText = readFileSync(resolve(root, 'src/lib/agent-runtime/worker.ts'), 'utf8');
assert(workerText.includes('executeResearchMemoAgentRun'), 'Research Memo Agent worker is not wired');
assert(workerText.includes('memo_output_created'), 'Research Memo Agent does not mirror memo output creation');

console.log('Tasklet policy workbench audit passed.');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

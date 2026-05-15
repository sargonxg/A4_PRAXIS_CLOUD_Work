import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { resolveGenkitGoogleProvider } from '../src/lib/genkit/provider';

const repoRoot = process.cwd();
const failures: string[] = [];
const warnings: string[] = [];

function requireFile(relativePath: string) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) failures.push(`Missing ${relativePath}`);
  return absolutePath;
}

function read(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json')) as {
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
for (const dep of ['genkit', '@genkit-ai/google-genai', '@genkit-ai/google-cloud']) {
  if (!packageJson.dependencies?.[dep]) failures.push(`package.json dependency missing: ${dep}`);
}
if (!packageJson.scripts?.['genkit:dev']?.includes('genkit start')) {
  failures.push('package.json script genkit:dev must start the Genkit dev UI');
}

const genkitIndex = read('src/lib/genkit/index.ts');
if (!genkitIndex.includes('vertexAI')) failures.push('src/lib/genkit/index.ts must initialize the Vertex AI plugin path');
if (!genkitIndex.includes('googleAI')) failures.push('src/lib/genkit/index.ts must retain the Google AI Studio fallback path');
if (!genkitIndex.includes('resolveGenkitGoogleProvider')) {
  failures.push('src/lib/genkit/index.ts must use the shared Genkit provider resolver');
}

const expectedFlows = [
  {
    name: 'situation-intelligence',
    flowFile: 'src/lib/genkit/flows/situation-intelligence.ts',
    promptFile: 'prompts/situation-intelligence.prompt',
    routeFile: 'src/app/api/ai/situation-intelligence/route.ts',
  },
  {
    name: 'classify-path',
    flowFile: 'src/lib/genkit/flows/classify-path.ts',
    promptFile: 'prompts/classify-path.prompt',
    routeFile: 'src/app/api/paths/classify/route.ts',
  },
  {
    name: 'sourceability',
    flowFile: 'src/lib/genkit/flows/sourceability.ts',
    promptFile: 'prompts/sourceability.prompt',
    routeFile: 'src/app/api/ai/sourceability/route.ts',
  },
];

for (const flow of expectedFlows) {
  requireFile(flow.flowFile);
  requireFile(flow.promptFile);
  const routePath = requireFile(flow.routeFile);
  if (existsSync(routePath) && !read(flow.routeFile).includes('@/lib/genkit/flows/')) {
    failures.push(`${flow.routeFile} does not import a Genkit flow`);
  }
}

const devRunner = read('src/lib/genkit/dev-runner.ts');
for (const flow of expectedFlows) {
  if (!devRunner.includes(`./flows/${flow.name}`)) {
    failures.push(`src/lib/genkit/dev-runner.ts does not import ./flows/${flow.name}`);
  }
}

const provider = resolveGenkitGoogleProvider();
if (provider.kind === 'vertex' && !provider.projectId && process.env.NODE_ENV === 'production') {
  failures.push('Genkit resolved Vertex in production without GOOGLE_VERTEX_PROJECT/GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT');
}
if (provider.kind === 'google-ai' && !provider.apiKey) {
  warnings.push('Genkit Google AI fallback has no API key; live flow calls will fail until GOOGLE_AI_API_KEY/GEMINI_API_KEY is set.');
}

console.log('Genkit runtime audit');
console.log(`- Provider: ${provider.kind}`);
console.log(`- Location: ${provider.location}`);
console.log(`- Reason: ${provider.reason}`);
console.log(`- Flow registry: ${expectedFlows.map((flow) => flow.name).join(', ')}`);

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log('audit:genkit-runtime OK');

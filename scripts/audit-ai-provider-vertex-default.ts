import { buildModelRuntimeHealthCheck, getAskPraxisModelRuntimePolicy } from '../src/lib/ai/model-runtime-policy';

const policy = getAskPraxisModelRuntimePolicy();
const health = buildModelRuntimeHealthCheck();
const failures: string[] = [];
const warnings: string[] = [];

if (policy.provider !== 'vertex') failures.push('Ask PRAXIS runtime policy must remain Vertex-first.');
if (!health.frontierPrimaryModels.every((model) => model.startsWith('gemini-3'))) {
  failures.push(`Frontier primary models must be Gemini 3 family: ${health.frontierPrimaryModels.join(', ')}`);
}
if (!health.stableFallbackModels.every((model) => model.startsWith('gemini-2.5'))) {
  failures.push(`Stable fallbacks must be Gemini 2.5 GA family: ${health.stableFallbackModels.join(', ')}`);
}
if (health.configuredVertexLocation !== policy.vertexLocationPolicy.frontierGemini3Location) {
  warnings.push(`Current shell Vertex Gemini location is ${health.configuredVertexLocation}; production Gemini 3 policy expects ${policy.vertexLocationPolicy.frontierGemini3Location}.`);
}
for (const warning of health.warnings) warnings.push(warning);

if (failures.length) {
  console.error('[audit:ai-provider-vertex-default] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
console.log('[audit:ai-provider-vertex-default] ok');

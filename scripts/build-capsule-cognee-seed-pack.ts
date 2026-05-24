import {
  CAPSULE_STARTER_DEFINITIONS,
  buildCapsuleCogneeSeedPack,
} from '../src/lib/product/context-capsules';

const starterId = parseStarterId(process.argv.slice(2))
  ?? 'starter-situation-eu-ai-act-2026-implementation-simplification';
const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);

if (!starter) {
  console.error(`Unknown starter capsule: ${starterId}`);
  console.error(`Known starters: ${CAPSULE_STARTER_DEFINITIONS.map((item) => item.starterId).slice(0, 20).join(', ')} ...`);
  process.exit(1);
}

const seedPack = buildCapsuleCogneeSeedPack(starter);
const liveAcceptanceReady = process.env.COGNEE_ENABLED === 'true'
  && Boolean(process.env.COGNEE_BACKEND_URL?.trim());

console.log(JSON.stringify({
  ...seedPack,
  liveAcceptance: {
    ready: liveAcceptanceReady,
    enabledByEnv: 'COGNEE_ENABLED=true',
    backendUrlEnv: 'COGNEE_BACKEND_URL',
    note: liveAcceptanceReady
      ? 'The isolated Cognee service can be used by a separate gated acceptance command.'
      : 'No live Cognee action was taken; this command only emits advisory seed payloads.',
  },
}, null, 2));

function parseStarterId(args: string[]): string | null {
  for (const arg of args) {
    if (arg.startsWith('--starter=')) return arg.slice('--starter='.length).trim() || null;
    if (arg.startsWith('--starterId=')) return arg.slice('--starterId='.length).trim() || null;
    if (!arg.startsWith('-')) return arg.trim() || null;
  }
  return null;
}

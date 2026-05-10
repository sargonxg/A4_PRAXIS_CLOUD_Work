import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const required = [
  'backend/migrations/0026_user_model_versions.py',
  'backend/types/context.py',
  'src/lib/user-models/types.ts',
  'src/lib/user-models/seeds.ts',
  'src/lib/user-models/store.ts',
  'src/lib/user-models/capture-loop.ts',
  'tests/users.test.ts',
];

for (const file of required) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const migration = read('backend/migrations/0026_user_model_versions.py');
for (const marker of ['user_model_versions', 'parent_model_id UUID NULL', 'fields_json JSONB NOT NULL', 'UNIQUE (user_uid, model_id, version)', 'version DESC']) {
  if (!migration.includes(marker)) failures.push(`migration missing ${marker}`);
}
if (/UPDATE\s+user_model_versions/i.test(migration)) failures.push('user_model_versions migration must not update fields_json');

const tsTypes = read('src/lib/user-models/types.ts');
for (const marker of ['methodologyToolkit', 'defaultOntologyStacks', 'toolAffinities', 'standingAssumptions', 'prohibitedFrames', 'workOntologyId', 'parentModelId']) {
  if (!tsTypes.includes(marker)) failures.push(`TS user model type missing ${marker}`);
}

const pyTypes = read('backend/types/context.py');
for (const marker of ['methodology_toolkit', 'default_ontology_stacks', 'tool_affinities', 'standing_assumptions', 'prohibited_frames', 'work_ontology_id', 'parent_model_id']) {
  if (!pyTypes.includes(marker)) failures.push(`Python user model type missing ${marker}`);
}

const seeds = read('src/lib/user-models/seeds.ts');
for (const id of ['foreign-policy-analyst', 'domestic-policy-analyst', 'corporate-strategic-analyst']) {
  if (!seeds.includes(id)) failures.push(`missing public user model seed ${id}`);
}
for (const workOntology of ['foreign-policy-research', 'domestic-policy-analysis', 'corporate-strategic-analysis']) {
  if (!seeds.includes(workOntology)) failures.push(`missing work ontology seed ${workOntology}`);
}

const store = read('src/lib/user-models/store.ts');
for (const marker of ['forkPublicUserModel', "visibility: 'private'", 'parentModelId: seed.modelId', 'users/${ownerUid}/user-models/${modelId}']) {
  if (!store.includes(marker)) failures.push(`user model store missing ${marker}`);
}

const capture = read('src/lib/user-models/capture-loop.ts');
for (const marker of ['buildCaptureSuggestion', 'applyCaptureSuggestionDraft', 'standingAssumptions', 'sourcePreferences']) {
  if (!capture.includes(marker)) failures.push(`capture loop missing ${marker}`);
}

const contextAware = read('src/lib/context/context-aware.ts');
for (const marker of ['activeUserModelId', 'userModel', 'getPublicUserModel']) {
  if (!contextAware.includes(marker)) failures.push(`ContextSnapshot user loading missing ${marker}`);
}

const gate = read('package.json');
if (!gate.includes('npm run audit:user-model-versioning')) failures.push('audit:gate missing audit:user-model-versioning');

if (failures.length > 0) {
  console.error('audit:user-model-versioning failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:user-model-versioning passed for migration, seeds, owner-scoped forks, context snapshot fields, and capture loop. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

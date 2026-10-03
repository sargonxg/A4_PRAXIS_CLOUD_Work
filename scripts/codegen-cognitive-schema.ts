import { mkdirSync, writeFileSync } from 'node:fs';
import { cognitiveJsonSchema } from '../src/lib/cognitive-capsule/schema';

mkdirSync('schemas/capsule', { recursive: true });
writeFileSync('schemas/capsule/cognitive-vnext.schema.json', `${JSON.stringify(cognitiveJsonSchema(), null, 2)}\n`);

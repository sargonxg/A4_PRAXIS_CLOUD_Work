import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../../../cli/praxis';
import { packCapsule } from '@/lib/cognitive-capsule/package';
import { CognitiveCapsuleSchema } from '@/lib/cognitive-capsule/schema';

const fixture = 'tests/fixtures/cognitive-capsule/policy-context.json';
const taskArgs = ['--objective', 'Draft an authorization and expenditure brief with evidence gaps.', '--scope', 'public-finance', '--as-of', '2026-11-07', '--role', 'domain-specialist'];

describe('local CLI capsule task workflow', () => {
  it('previews, exports and reopens without network calls, preserving exact native bytes and recorded review states', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'praxis-task-'));
    try {
      const capsule = CognitiveCapsuleSchema.parse(JSON.parse(await readFile(fixture, 'utf8')));
      const bytes = await packCapsule(capsule);
      await writeFile(join(directory, 'input.capsule'), bytes);
      const request = vi.fn().mockRejectedValue(new Error('Network must remain unused'));
      const output: string[] = [];
      const options = { cwd: directory, write: (text: string) => output.push(text), fetch: request };
      await runCli(['capsule', 'task', 'input.capsule', ...taskArgs], options);
      const preview = JSON.parse(output.at(-1)!);
      expect(preview.modelExecuted).toBe(false);
      expect(preview.sources[1].stance).toBe('qualifies');
      expect(preview.view.omissions).toContainEqual({ id: 'unreviewed-disbursement', reason: 'not-accepted' });
      await expect(runCli(['capsule', 'task', 'input.capsule', ...taskArgs, '--output', 'saved'], options)).rejects.toThrow(/allow-write/);
      await runCli(['capsule', 'task', 'input.capsule', ...taskArgs, '--output', 'saved', '--allow-write'], options);
      expect(await readFile(join(directory, 'saved/source.capsule'))).toEqual(Buffer.from(bytes));
      expect(await readFile(join(directory, 'saved/prompt.txt'), 'utf8')).toBe(preview.prompt);
      await runCli(['capsule', 'reopen', 'saved'], options);
      expect(JSON.parse(output.at(-1)!)).toEqual(preview);
      await runCli(['capsule', 'reopen', 'saved', '--format', 'prompt'], options);
      expect(output.at(-1)).toBe(preview.prompt);
      await expect(runCli(['capsule', 'task', 'input.capsule', ...taskArgs, '--output', 'saved', '--allow-write'], options)).rejects.toThrow(/EEXIST/);
      await writeFile(join(directory, 'saved/prompt.txt'), 'altered prompt');
      await expect(runCli(['capsule', 'reopen', 'saved'], options)).rejects.toThrow(/changed/);
      expect(request).not.toHaveBeenCalled();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('packages supported JSON without changing it and rejects unsupported schemas and symlink destinations', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'praxis-task-json-'));
    try {
      const original = await readFile(fixture, 'utf8');
      await writeFile(join(directory, 'input.json'), original);
      const options = { cwd: directory, write: () => {} };
      await runCli(['capsule', 'task', 'input.json', ...taskArgs, '--output', 'saved', '--allow-write'], options);
      await runCli(['capsule', 'reopen', 'saved'], options);
      expect(await readFile(join(directory, 'input.json'), 'utf8')).toBe(original);
      await writeFile(join(directory, 'unsupported.json'), JSON.stringify({ schemaVersion: 'native-v2' }));
      await expect(runCli(['capsule', 'task', 'unsupported.json', ...taskArgs], options)).rejects.toThrow();
      await symlink(join(directory, 'saved'), join(directory, 'alias'));
      await expect(runCli(['capsule', 'task', 'input.json', ...taskArgs, '--output', 'alias/new', '--allow-write'], options)).rejects.toThrow(/symlink/);
      await expect(runCli(['capsule', 'reopen', 'alias'], options)).rejects.toThrow(/symlink/);
      const manifest = JSON.parse(await readFile(join(directory, 'saved/task.json'), 'utf8'));
      await writeFile(join(directory, 'saved/task.json'), JSON.stringify({ ...manifest, sourceFile: '../input.json' }));
      await expect(runCli(['capsule', 'reopen', 'saved'], options)).rejects.toThrow();
      await writeFile(join(directory, 'saved/task.json'), JSON.stringify(manifest));
      await expect(runCli(['capsule', 'reopen', 'saved', '--output', 'changed'], options)).rejects.toThrow(/read-only/);
      await expect(runCli(['capsule', 'task', 'input.json', ...taskArgs, '--format', 'native-v2'], options)).rejects.toThrow(/format/);
      await writeFile(join(directory, 'saved/prompt.txt'), Buffer.from([0xff]));
      await expect(runCli(['capsule', 'reopen', 'saved'], options)).rejects.toThrow(/encoded|encoding|UTF/);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});

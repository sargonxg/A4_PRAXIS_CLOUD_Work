#!/usr/bin/env node
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CognitiveCapsuleSchema } from '../src/lib/cognitive-capsule/schema';
import { CognitiveGraph } from '../src/lib/cognitive-capsule/graph';
import { capsuleDigest, semanticDiff } from '../src/lib/cognitive-capsule/integrity';
import { PACKAGE_LIMITS, packCapsule, readCapsulePackage } from '../src/lib/cognitive-capsule/package';
import { LocalCapsuleRegistry } from '../src/lib/cognitive-capsule/registry';
import type { CognitiveCapsule } from '../src/lib/cognitive-capsule/types';

type RemoteOptions = { baseUrl?: string; session?: string; authOrigin?: string; fetch?: typeof fetch };
type CliOptions = RemoteOptions & { cwd?: string; registry?: string; write?: (output: string) => void };
const HELP = `PRAXIS local capsule CLI\n
capsule list [--directory DIR | --registry DIR]
capsule inspect|validate|graph|eval FILE
capsule diff BEFORE AFTER
capsule pack JSON --output FILE --allow-write
capsule unpack FILE --output NEW_DIRECTORY --allow-write
capsule publish FILE [--registry DIR] --allow-write
capsule install NAME VERSION [--registry DIR] --allow-write
capsule fork NAME VERSION NEW_NAME --output JSON --allow-write
capsule deprecate NAME VERSION --reason TEXT --allow-write
ask QUESTION --capsule ID
run OBJECTIVE --capsule ID
receipt RUN_ID
list --capsule ID
whoami
Remote commands require PRAXIS_BASE_URL, PRAXIS_AUTH_ORIGIN and PRAXIS_SESSION.
Local eval reports deterministic structural checks; it is not a model ablation.
`;

async function safeLocalPath(path: string) {
  const full = resolve(path); let current = full;
  while (true) {
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Local output paths cannot traverse symlinks.'); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
    const parent = dirname(current); if (parent === current) break; current = parent;
  }
  return full;
}
async function boundedFile(path: string): Promise<Buffer> {
  const full = await safeLocalPath(path); const stat = await lstat(full);
  if (!stat.isFile() || stat.size > PACKAGE_LIMITS.maxArchiveBytes) throw new Error('Local input exceeds archive budget or is not a file.');
  const bytes = await readFile(full); if (bytes.length > PACKAGE_LIMITS.maxArchiveBytes) throw new Error('Local input exceeds byte budget.'); return bytes;
}
async function load(path: string): Promise<CognitiveCapsule> {
  const bytes = await boundedFile(path);
  if (path.endsWith('.capsule')) return (await readCapsulePackage(bytes)).capsule;
  return CognitiveCapsuleSchema.parse(JSON.parse(bytes.toString('utf8')));
}
async function save(path: string, bytes: string | Uint8Array, allowWrite: boolean) {
  if (!allowWrite) throw new Error('Local writes require --allow-write.');
  await writeFile(await safeLocalPath(path), bytes, { flag: 'wx', mode: 0o600 });
}
function redact(value: unknown, secrets: string[]): unknown {
  if (typeof value === 'string') return secrets.reduce((v, s) => s ? v.split(s).join('[redacted]') : v, value);
  if (Array.isArray(value)) return value.map((v) => redact(v, secrets));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /^(?:token|authorization|cookie|secret|apiKey|accessToken|refreshToken)$/i.test(k) ? '[redacted]' : redact(v, secrets)]));
  return value;
}

/** Use the existing signed session cookie contract, scoped to an explicitly declared origin. */
export async function remoteRequest(path: string, method: 'GET' | 'POST', body: unknown, options: RemoteOptions = {}): Promise<unknown> {
  const base = new URL(options.baseUrl ?? process.env.PRAXIS_BASE_URL ?? 'https://praxis.tacitus.me');
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) throw new Error('Remote API requires HTTPS except localhost.');
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Base URL must contain only a safe origin.');
  const origin = options.authOrigin ?? process.env.PRAXIS_AUTH_ORIGIN;
  if (!origin || new URL(origin).href !== `${base.origin}/`) throw new Error('Session authentication origin must exactly match the API origin.');
  if (!path.startsWith('/api/') || path.startsWith('//') || path.includes('\\')) throw new Error('Invalid API path or origin.');
  const url = new URL(path, base); if (url.origin !== base.origin) throw new Error('Cross-origin API request rejected.');
  const session = options.session ?? process.env.PRAXIS_SESSION;
  if (!session || /[\x00-\x20\x7f;,]/.test(session)) throw new Error('PRAXIS_SESSION must be an encoded signed session cookie, never a raw token.');
  let decoded: string; let token = '';
  try {
    decoded = decodeURIComponent(session); const split = decoded.lastIndexOf('.');
    if (split < 1 || !/^[a-zA-Z0-9_-]{43}$/.test(decoded.slice(split + 1))) throw new Error('Unsigned session');
    const payload = JSON.parse(decoded.slice(0, split));
    if (typeof payload.token !== 'string' && payload.demo !== true) throw new Error('Unsupported session');
    token = typeof payload.token === 'string' ? payload.token : '';
  } catch { throw new Error('PRAXIS_SESSION must be an encoded signed session cookie.'); }
  const response = await (options.fetch ?? fetch)(url.href, {
    method, headers: { Cookie: `tacitus-auth-session=${session}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`PRAXIS API request failed (${response.status}).`);
  const reader = response.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  if (reader) {
    try { while (true) { const next = await reader.read(); if (next.done) break; size += next.value.length; if (size > 8 * 1024 * 1024) throw new Error('API response byte budget exceeded.'); chunks.push(next.value); } }
    finally { await reader.cancel(); }
  }
  const result = Buffer.concat(chunks).toString('utf8');
  let value: unknown = result;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try { value = JSON.parse(result); } catch { throw new Error('PRAXIS API returned invalid JSON.'); }
  }
  return redact(value, [session, decoded, token]);
}

export async function runCli(args: string[], options: CliOptions = {}): Promise<void> {
  const out = options.write ?? ((v: string) => process.stdout.write(`${v}\n`));
  if (!args.length || ['help', '--help', '-h'].includes(args[0])) { out(HELP); return; }
  const positional: string[] = []; const flags: Record<string, string | boolean> = {};
  const valued = new Set(['output', 'directory', 'registry', 'reason', 'capsule', 'base-url', 'auth-origin']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    const key = arg.slice(2);
    if (key in flags) throw new Error(`Duplicate option --${key}.`);
    if (key === 'allow-write') flags[key] = true;
    else if (valued.has(key) && args[i + 1] && !args[i + 1].startsWith('--')) flags[key] = args[++i];
    else throw new Error(`Unknown or incomplete option --${key}.`);
  }
  const required = (value: string | undefined, label: string) => { if (!value) throw new Error(`Missing ${label}.`); return value; };
  const flag = (key: string) => typeof flags[key] === 'string' ? flags[key] as string : undefined;
  const allowWrite = flags['allow-write'] === true;
  const localPath = (p: string) => resolve(options.cwd ?? process.cwd(), p);
  const emit = (v: unknown) => out(JSON.stringify(v, null, 2));
  const registry = () => new LocalCapsuleRegistry(localPath(flag('registry') ?? options.registry ?? join(homedir(), '.praxis', 'registry')));
  const [command, action, file, other] = positional;
  if (command === 'capsule') {
    if (action === 'list') {
      if (flag('directory')) { const dir = localPath(flag('directory')!); const names = (await readdir(dir)).filter((n) => n.endsWith('.capsule')); const rows = []; for (const n of names) { const c = await load(join(dir, n)); rows.push({ file: n, capsuleId: c.capsuleId, version: c.version, profile: c.profile, digest: capsuleDigest(c) }); } emit(rows); }
      else emit(await registry().list()); return;
    }
    if (action === 'publish') { emit(await registry().publish(await boundedFile(localPath(required(file, 'file'))), { allowWrite })); return; }
    if (action === 'install') { emit(await registry().install(required(file, 'name'), required(other, 'version'), { allowWrite })); return; }
    if (action === 'deprecate') { emit(await registry().deprecate(required(file, 'name'), required(other, 'version'), required(flag('reason'), '--reason'), { allowWrite })); return; }
    if (action === 'fork') { const c = await registry().fork(required(file, 'name'), required(other, 'version'), required(positional[4], 'new name'), { allowWrite }); await save(localPath(required(flag('output'), '--output')), JSON.stringify(c, null, 2), allowWrite); emit({ capsuleId: c.capsuleId, version: c.version, published: false }); return; }
    if (!['inspect', 'validate', 'graph', 'diff', 'pack', 'unpack', 'eval'].includes(action)) throw new Error('Unknown capsule command.');
    const input = localPath(required(file, 'file'));
    if (action === 'unpack') {
      if (!allowWrite) throw new Error('Unpack requires --allow-write.');
      const { files, manifest } = await readCapsulePackage(await boundedFile(input));
      const destination = await safeLocalPath(localPath(required(flag('output'), '--output')));
      await mkdir(destination, { mode: 0o700 }); // Existing destinations are rejected.
      for (const [path, bytes] of Object.entries({ ...files, 'manifest.json': Buffer.from(JSON.stringify(manifest, null, 2)) })) {
        const target = await safeLocalPath(join(destination, path)); await mkdir(dirname(target), { recursive: true, mode: 0o700 }); await save(target, bytes, true);
      }
      emit({ directory: destination, capsuleId: manifest.capsuleId, version: manifest.version }); return;
    }
    const c = await load(input); const graph = new CognitiveGraph(c);
    if (action === 'inspect') emit({ capsuleId: c.capsuleId, version: c.version, profile: c.profile, rights: c.rights, dependencies: c.dependencies, digest: capsuleDigest(c), counts: { nodes: c.nodes.length, statements: c.statements.length, evidence: c.evidence.length, knowledge: c.knowledge.length } });
    if (action === 'graph') emit(graph.toJsonLd());
    if (action === 'validate') { const issues = graph.validate(); emit({ structuralValidation: issues.length === 0 ? 'passed' : 'failed', factualTruthVerified: false, issues }); if (issues.length) throw new Error('Structural validation failed.'); }
    if (action === 'eval') emit({ kind: 'deterministic-structural', modelAblation: false, factualTruthVerified: false, scenarios: [{ name: 'graph-reference-integrity', passed: graph.validate().length === 0 }, { name: 'JSON-LD-roundtrip', passed: capsuleDigest(CognitiveGraph.fromJsonLd(graph.toJsonLd()).toCapsule()) === capsuleDigest(c) }], issues: graph.validate() });
    if (action === 'diff') emit(semanticDiff(c, await load(localPath(required(other, 'second file')))));
    if (action === 'pack') { await save(localPath(required(flag('output'), '--output')), await packCapsule(c), allowWrite); emit({ output: flag('output'), digest: capsuleDigest(c) }); }
    return;
  }
  const remote = { ...options, baseUrl: flag('base-url') ?? options.baseUrl, authOrigin: flag('auth-origin') ?? options.authOrigin };
  if (command === 'ask') { emit(await remoteRequest('/api/ai/ask-praxis', 'POST', { messages: [{ role: 'user', content: required(action, 'question') }], capsuleId: required(flag('capsule'), '--capsule') }, remote)); return; }
  if (command === 'run') { emit(await remoteRequest('/api/agents/runs', 'POST', { objective: required(action, 'objective'), capsuleId: required(flag('capsule'), '--capsule'), triggerType: 'manual' }, remote)); return; }
  if (command === 'receipt') { emit(await remoteRequest(`/api/agents/runs/${encodeURIComponent(required(action, 'run id'))}`, 'GET', undefined, remote)); return; }
  if (command === 'list') { emit(await remoteRequest(`/api/agents/runs?capsuleId=${encodeURIComponent(required(flag('capsule'), '--capsule'))}`, 'GET', undefined, remote)); return; }
  if (command === 'whoami') { emit(await remoteRequest('/api/auth/session', 'GET', undefined, remote)); return; }
  throw new Error('Unknown command. Run praxis help.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : 'CLI operation failed.'}\n`); process.exitCode = 1; });
}

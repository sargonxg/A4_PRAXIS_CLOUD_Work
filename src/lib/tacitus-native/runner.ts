import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdtemp, open, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { NativeAttachmentError } from './contract';
import type { NativeRunner } from './adapter';

export const NATIVE_CORE_COMMIT = '0d47eafd93f2b4a5e4a926d3c761410b1c319cd6';
export const NATIVE_CORE_PATCH = '5dbf6a9c000b7a381601063115c9b08d4b509d239b7edd9d2c4b0067f3856611';
export interface NativeRunnerConfig {
  binaryPath: string; binarySha256: string;
  coreCommit: typeof NATIVE_CORE_COMMIT; patchSha256: typeof NATIVE_CORE_PATCH;
  timeoutMs?: number; scratchRoot?: string;
}
/** Configuration is supplied by trusted server composition, never an HTTP body.
 * The build receipt and binary digest are deployment inputs, not self-attestation. */
export function createPinnedNativeRunner(config: NativeRunnerConfig): NativeRunner {
  if (!isAbsolute(config.binaryPath) || !/^[a-f0-9]{64}$/.test(config.binarySha256)
    || config.coreCommit !== NATIVE_CORE_COMMIT || config.patchSha256 !== NATIVE_CORE_PATCH
    || (config.scratchRoot && !isAbsolute(config.scratchRoot)))
    throw new NativeAttachmentError('native_binary_provenance_invalid', 503);
  const timeoutMs = config.timeoutMs ?? 10000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000)
    throw new NativeAttachmentError('native_timeout_invalid', 503);
  let active = 0;
  return { async run(mode, bytes, request, signal) {
    if (mode !== 'inspect' && mode !== 'reuse') throw new NativeAttachmentError('native_mode_invalid', 400);
    if (signal?.aborted) throw new NativeAttachmentError('native_cancelled');
    if (active >= 2) throw new NativeAttachmentError('native_runner_busy', 503);
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new NativeAttachmentError('native_input_budget_exceeded', 400);
    const archiveBytes = Uint8Array.from(bytes);
    const stdin = request === undefined ? '' : JSON.stringify(request);
    if (Buffer.byteLength(stdin) > 16384) throw new NativeAttachmentError('native_query_budget_exceeded', 400);
    active++;
    let directory: string | undefined;
    try {
      directory = await mkdtemp(join(config.scratchRoot ?? tmpdir(), 'praxis-native-'));
      // Verify bytes from an opened regular file, then execute a private immutable copy.
      const source = await open(config.binaryPath, constants.O_RDONLY | constants.O_NOFOLLOW);
      let binary: Buffer;
      try {
        const stat = await source.stat();
        if (!stat.isFile() || stat.size < 1 || stat.size > 64 * 1024 * 1024)
          throw new NativeAttachmentError('native_binary_provenance_invalid', 503);
        const bounded = Buffer.alloc(stat.size + 1); let length = 0;
        while (length < bounded.length) {
          const { bytesRead } = await source.read(bounded, length, bounded.length - length, null);
          if (!bytesRead) break;
          length += bytesRead;
        }
        if (length !== stat.size) throw new NativeAttachmentError('native_binary_provenance_invalid', 503);
        binary = bounded.subarray(0, length);
      } finally { await source.close(); }
      if (createHash('sha256').update(binary).digest('hex') !== config.binarySha256)
        throw new NativeAttachmentError('native_binary_provenance_invalid', 503);
      const executable = join(directory, process.platform === 'win32' ? 'knowledge_capture.exe' : 'knowledge_capture');
      const archive = join(directory, 'input.zip');
      await writeFile(executable, binary, { mode: 0o500, flag: 'wx' });
      await writeFile(archive, archiveBytes, { mode: 0o400, flag: 'wx' });
      if (signal?.aborted) throw new NativeAttachmentError('native_cancelled');
      return await new Promise<Uint8Array>((resolve, reject) => {
        // libuv otherwise reintroduces these parent values on Windows even when
        // spawn receives an explicit environment. Empty entries prevent inheritance.
        const env: NodeJS.ProcessEnv = { LANG: 'C.UTF-8', TZ: 'UTC', NODE_ENV: 'production' };
        if (process.platform === 'win32') {
          for (const key of ['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'PATH', 'SYSTEMDRIVE',
            'SYSTEMROOT', 'TEMP', 'USERDOMAIN', 'USERNAME', 'USERPROFILE', 'WINDIR']) env[key] = '';
        }
        const child = spawn(executable, [mode, archive], {
          cwd: directory, shell: false, windowsHide: true,
          env, stdio: ['pipe', 'pipe', 'pipe'],
        });
        const chunks: Buffer[] = []; let size = 0; let stderrSize = 0; let failure: Error | undefined;
        const stop = (error: Error) => { failure ??= error; child.kill('SIGKILL'); };
        const cancel = () => stop(new NativeAttachmentError('native_cancelled'));
        const timer = setTimeout(() => stop(new NativeAttachmentError('native_timeout')), timeoutMs);
        signal?.addEventListener('abort', cancel, { once: true });
        if (signal?.aborted) cancel();
        child.stdout.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) stop(new NativeAttachmentError('native_output_budget_exceeded'));
          else chunks.push(chunk);
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderrSize += chunk.length;
          if (stderrSize > 8192) stop(new NativeAttachmentError('native_stderr_budget_exceeded'));
        });
        child.on('error', () => { failure ??= new NativeAttachmentError('native_process_unavailable', 503); });
        child.stdin.on('error', () => { failure ??= new NativeAttachmentError('native_process_refused'); });
        child.once('close', (code) => {
          clearTimeout(timer); signal?.removeEventListener('abort', cancel);
          if (failure) reject(failure);
          else if (code !== 0) reject(new NativeAttachmentError('native_process_refused'));
          else resolve(Buffer.concat(chunks));
        });
        child.stdin.end(stdin);
      });
    } finally {
      try { if (directory) await rm(directory, { recursive: true, force: true }); }
      finally { active--; }
    }
  } };
}

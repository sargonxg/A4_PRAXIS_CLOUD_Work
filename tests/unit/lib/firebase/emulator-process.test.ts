import { execFileSync, spawn } from 'node:child_process';
import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { runBoundedChild } from '../../../../scripts/emulators/bounded-process.mjs';

function output() {
  const stream = new PassThrough(); let text = '';
  stream.on('data', chunk => { text += chunk.toString(); });
  return { stream, read: () => text };
}

describe('bounded owned emulator processes', () => {
  it('records an ordinary successful exit without timing out', async () => {
    const log = output();
    const result = await runBoundedChild(process.execPath, ['-e', 'process.stdout.write("complete")'], {
      env: process.env, cwd: process.cwd(), stdout: log.stream, stderr: log.stream, timeoutMs: 10_000,
    });
    expect(result).toEqual({ exit: 0, timedOut: false });
    expect(log.read()).toBe('complete');
  });

  it('expires a stage and stops its descendant while preserving an unrelated child', async () => {
    const sentinel = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { windowsHide: true, stdio: 'ignore' });
    const log = output();
    try {
      const result = await runBoundedChild(process.execPath, ['-e', `
        const child=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'});
        console.log(child.pid); setInterval(()=>{},1000);
      `], { env: process.env, cwd: process.cwd(), stdout: log.stream, stderr: log.stream, timeoutMs: 1000 });
      expect(result.timedOut).toBe(true);
      const descendant = Number(log.read().trim());
      expect(descendant).toBeGreaterThan(0);
      expect(() => process.kill(descendant, 0)).toThrow();
      expect(() => process.kill(sentinel.pid!, 0)).not.toThrow();
    } finally { sentinel.kill(); }
  }, 30_000);

  it('honors an already-expired overall deadline before spawning', async () => {
    const controller = new AbortController(); controller.abort(); const log = output();
    await expect(runBoundedChild(process.execPath, ['-e', 'throw Error("should not start")'], {
      env: process.env, cwd: process.cwd(), stdout: log.stream, stderr: log.stream, timeoutMs: 1000, signal: controller.signal,
    })).rejects.toThrow(/deadline/);
    expect(log.read()).toBe('');
  });

  it('stops an active child when the overall deadline aborts', async () => {
    const controller = new AbortController(); const log = output();
    const timer = setTimeout(() => controller.abort(), 1000);
    try {
      const result = await runBoundedChild(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {
        env: process.env, cwd: process.cwd(), stdout: log.stream, stderr: log.stream, timeoutMs: 20_000, signal: controller.signal,
      });
      expect(result.timedOut).toBe(true);
    } finally { clearTimeout(timer); }
  }, 30_000);

  it('fails closed for an abruptly exited root without touching an unrelated process', async () => {
    const sentinel = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { windowsHide: true, stdio: 'ignore' });
    const log = output(); const started = new Date(Date.now() - 1000).toISOString();
    try {
      await expect(runBoundedChild(process.execPath, ['-e', `
        const child=require('node:child_process').spawn(process.execPath,['-e',"process.title='praxis-orphan-fixture';setInterval(()=>{},1000)"],{windowsHide:true,stdio:'ignore',detached:true});
        child.once('spawn',()=>{console.log(JSON.stringify({parent:process.pid,child:child.pid}));child.unref();process.exit(1)});
      `], { env: process.env, cwd: process.cwd(), stdout: log.stream, stderr: log.stream, timeoutMs: 10_000 }))
        .rejects.toMatchObject({ code: 'OWNED_DESCENDANTS_UNVERIFIED' });
      const owned = JSON.parse(log.read().trim()) as { parent: number; child: number };
      expect(() => process.kill(owned.child, 0)).not.toThrow();
      expect(() => process.kill(sentinel.pid!, 0)).not.toThrow();
    } finally {
      sentinel.kill();
      if (log.read().trim()) {
        const owned = JSON.parse(log.read().trim()) as { parent: number; child: number };
        if (process.platform === 'win32') {
          execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `
            $p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${owned.child}'
            if ($p) {
              if ($p.ParentProcessId -ne ${owned.parent} -or !$p.CommandLine.Contains('praxis-orphan-fixture') -or $p.CreationDate.ToUniversalTime() -lt [DateTime]::Parse('${started}')) { throw 'Fixture ownership changed' }
              Stop-Process -Id $p.ProcessId -Force
            }
          `], { windowsHide: true, timeout: 10_000, stdio: 'pipe' });
        } else {
          // detached:true gives the orphan its own group, whose ID is its PID.
          try { process.kill(-owned.child, 'SIGKILL'); } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
          }
        }
      }
    }
  }, 30_000);
});

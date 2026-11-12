import { execFile, spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

function unverifiedDescendants(rootExit = null) {
  const error = new Error('Root exited before owned descendant cleanup could be verified');
  error.code = 'OWNED_DESCENDANTS_UNVERIFIED';
  error.rootExit = rootExit;
  return error;
}

/** Linux containers may retain already-dead descendants as zombies until PID 1
 * reaps them. A zero-signal probe alone cannot distinguish those from live work.
 * Unknown procfs errors still fail closed; never infer cleanup from unreadability. */
async function linuxGroupHasLiveMembers(groupId) {
  for (const entry of await readdir('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let stat;
    try { stat = await readFile(`/proc/${entry}/stat`, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT' || error.code === 'ESRCH') continue; throw error; }
    const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
    if (fields.length < 3 || !Number.isInteger(Number(fields[2]))) throw new Error('Invalid process-group identity');
    if (Number(fields[2]) === groupId && fields[0] !== 'Z' && fields[0] !== 'X') return true;
  }
  return false;
}

/** Stop only the child we spawned and its verified descendants. Never use ports. */
export async function terminateOwnedProcessTree(child) {
  if (!child.pid) return;
  if (child.exitCode !== null || child.signalCode !== null) throw unverifiedDescendants();
  if (process.platform === 'win32') {
    // Windows console children do not implement POSIX graceful signals. Ask the
    // owned tree to close first, then force only still-identical processes.
    const script = `
      $ErrorActionPreference='Stop'
      $root=Get-CimInstance Win32_Process -Filter 'ProcessId = ${child.pid}'
      if (!$root) { throw 'OWNED_DESCENDANTS_UNVERIFIED' }
      if ($root.ParentProcessId -ne ${process.pid}) { throw 'Process ownership changed' }
      $all=@(Get-CimInstance Win32_Process)
      $owned=@($root); $index=0
      while ($index -lt $owned.Count) {
        $parent=$owned[$index]; $index++
        $owned+=@($all | Where-Object { $_.ParentProcessId -eq $parent.ProcessId -and $_.CreationDate -ge $parent.CreationDate })
      }
      Start-Process -FilePath ([IO.Path]::Combine($env:SystemRoot,'System32','taskkill.exe')) -ArgumentList @('/PID','${child.pid}','/T') -WindowStyle Hidden -Wait | Out-Null
      Start-Sleep -Milliseconds 500
      $current=Get-CimInstance Win32_Process -Filter 'ProcessId = ${child.pid}'
      if ($current -and $current.CreationDate -eq $root.CreationDate -and $current.ParentProcessId -eq ${process.pid}) {
        Start-Process -FilePath ([IO.Path]::Combine($env:SystemRoot,'System32','taskkill.exe')) -ArgumentList @('/PID','${child.pid}','/T','/F') -WindowStyle Hidden -Wait | Out-Null
      }
      [array]::Reverse($owned)
      foreach ($expected in $owned) {
        $current=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$expected.ProcessId)
        if ($current -and $current.CreationDate -eq $expected.CreationDate -and $current.ParentProcessId -eq $expected.ParentProcessId) {
          Stop-Process -Id $current.ProcessId -Force -ErrorAction SilentlyContinue
        }
      }
      foreach ($expected in $owned) {
        $current=Get-CimInstance Win32_Process -Filter ('ProcessId = '+$expected.ProcessId)
        if ($current -and $current.CreationDate -eq $expected.CreationDate) { throw 'Owned process remained after cleanup' }
      }
      exit 0
    `;
    try {
      await promisify(execFile)('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, timeout: 20_000, maxBuffer: 64 * 1024 });
    } catch (error) {
      if (String(error.stderr).includes('OWNED_DESCENDANTS_UNVERIFIED')) throw unverifiedDescendants();
      throw error;
    }
  } else {
    // detached:true creates this lane's own process group on POSIX.
    try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    await delay(500);
    try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    for (let attempt = 0; attempt < 10; attempt++) {
      try { process.kill(-child.pid, 0); }
      catch (error) { if (error.code === 'ESRCH') return; throw error; }
      if (process.platform === 'linux' && !await linuxGroupHasLiveMembers(child.pid)) return;
      await delay(500);
    }
    throw new Error('Owned process group remained after cleanup');
  }
}

/**
 * @param {string} executable
 * @param {string[]} args
 * @param {{env:NodeJS.ProcessEnv,cwd:string,stdout:import('node:stream').Writable,stderr:import('node:stream').Writable,timeoutMs:number,signal?:AbortSignal}} options
 */
export async function runBoundedChild(executable, args, { env, cwd, stdout, stderr, timeoutMs, signal }) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || signal?.aborted) throw new Error('Emulator lane deadline expired');
  const child = spawn(executable, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    detached: process.platform !== 'win32' });
  child.stdout.pipe(stdout, { end: false }); child.stderr.pipe(stderr, { end: false });
  let timedOut = false; let cleanup; let deadlineResolve; let deadlineReject;
  const deadline = new Promise((resolve, reject) => { deadlineResolve = resolve; deadlineReject = reject; });
  const stop = () => {
    timedOut = true;
    if (!cleanup) {
      cleanup = terminateOwnedProcessTree(child);
      cleanup.then(() => deadlineResolve({ exit: child.exitCode, timedOut: true }), deadlineReject);
    }
  };
  const timer = setTimeout(stop, timeoutMs);
  signal?.addEventListener('abort', stop, { once: true });
  try {
    const completion = new Promise((resolve, reject) => {
      child.once('error', reject); child.once('close', exit => resolve({ exit, timedOut }));
    });
    const result = await Promise.race([completion, deadline]);
    if (cleanup) await cleanup;
    // A failed root can exit before its emulators/browser descendants. Do not
    // infer cleanup or kill recycled PIDs after losing the parent identity.
    if (!result.timedOut && result.exit !== 0) throw unverifiedDescendants(result.exit);
    return result;
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', stop);
  }
}

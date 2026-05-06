#!/usr/bin/env node

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || 'true'];
  }),
);

const target = args.get('target') || 'http://localhost:3000';
const mode = args.get('mode') || 'smoke';
const concurrency = Number(args.get('concurrency') || (mode === 'stress' ? 25 : 4));
const requests = Number(args.get('requests') || (mode === 'stress' ? 250 : 24));
const path = args.get('path') || '/api/health';

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function oneRequest(i) {
  const started = Date.now();
  try {
    const response = await fetch(new URL(path, target), { cache: 'no-store' });
    return { i, status: response.status, ok: response.ok, latencyMs: Date.now() - started };
  } catch (error) {
    return { i, status: 0, ok: false, latencyMs: Date.now() - started, error: error.message };
  }
}

const pending = Array.from({ length: requests }, (_, i) => i);
const results = [];

async function worker() {
  while (pending.length > 0) {
    const next = pending.shift();
    if (next === undefined) return;
    results.push(await oneRequest(next));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

const failures = results.filter((result) => !result.ok);
const latencies = results.map((result) => result.latencyMs);
const report = {
  target,
  mode,
  path,
  requests,
  concurrency,
  ok: failures.length === 0,
  errorRate: results.length === 0 ? 1 : failures.length / results.length,
  latency: {
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    max: Math.max(...latencies),
  },
  failures: failures.slice(0, 10),
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);

type CanaryPhase = '5' | '25' | '100';

export {};

interface Sample {
  path: string;
  status: number;
  ok: boolean;
  latencyMs: number;
}

function arg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const match = process.argv.find((item) => item.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function sample(baseUrl: string, path: string): Promise<Sample> {
  const started = Date.now();
  try {
    const response = await fetch(new URL(path, baseUrl), { cache: 'no-store' });
    return {
      path,
      status: response.status,
      ok: response.ok,
      latencyMs: Date.now() - started,
    };
  } catch {
    return {
      path,
      status: 0,
      ok: false,
      latencyMs: Date.now() - started,
    };
  }
}

async function main() {
  const phase = arg('phase') as CanaryPhase | undefined;
  const baseUrl = arg('url', 'https://praxis.tacitus.me')!;
  const samplesPerPath = Number(arg('samples', '3'));
  const paths = ['/', '/api/health', '/demo', '/login'];

  if (!phase || !['5', '25', '100'].includes(phase)) {
    throw new Error('Usage: tsx scripts/canary-monitor.ts --phase=5|25|100 [--url=https://praxis.tacitus.me] [--samples=3]');
  }

  const samples: Sample[] = [];
  for (let i = 0; i < samplesPerPath; i++) {
    for (const path of paths) {
      samples.push(await sample(baseUrl, path));
    }
  }

  const failures = samples.filter((item) => !item.ok);
  const errorRate = samples.length === 0 ? 1 : failures.length / samples.length;
  const p95 = percentile(samples.map((item) => item.latencyMs), 95);
  const thresholdErrorRate = 0.005;
  const thresholdP95 = Number(arg('p95-ms', '5000'));
  const result = {
    phase,
    baseUrl,
    sampleCount: samples.length,
    errorRate,
    p95LatencyMs: p95,
    thresholdErrorRate,
    thresholdP95,
    status: errorRate <= thresholdErrorRate && p95 <= thresholdP95 ? 'pass' : 'fail',
    failures,
  };

  console.log(JSON.stringify(result, null, 2));

  if (result.status !== 'pass') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[canary-monitor] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

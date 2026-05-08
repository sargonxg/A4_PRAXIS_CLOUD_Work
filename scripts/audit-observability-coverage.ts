import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks: Array<{ label: string; file: string; mustInclude: string[] }> = [
  {
    label: 'Next instrumentation initializes tracing',
    file: 'src/instrumentation.ts',
    mustInclude: ['initTracing', 'register'],
  },
  {
    label: 'Cloud Trace exporter is configured',
    file: 'src/lib/observability/tracing.ts',
    mustInclude: ['TraceExporter', 'GCP_PROJECT_ID', 'getNodeAutoInstrumentations'],
  },
  {
    label: 'Structured logger supports Cloud Logging',
    file: 'src/lib/observability/logger.ts',
    mustInclude: ['LoggingWinston', 'logApiCall', 'latencyMs', 'providerFallback'],
  },
  {
    label: 'Authenticated API wrapper emits API call logs',
    file: 'src/lib/api/with-auth.ts',
    mustInclude: ['logApiCall', 'latencyMs', 'status'],
  },
  {
    label: 'Health endpoint publishes production safeguards',
    file: 'src/app/api/health/route.ts',
    mustInclude: ['safeguards', 'aiRequestLimits', 'highCostAiRoutesRequireAuth'],
  },
  {
    label: 'Operational metrics cron records diagnostics snapshots',
    file: 'src/lib/admin/operational-metrics.ts',
    mustInclude: ['operational_metrics', 'Tool Health', 'Symbolic Firewall'],
  },
  {
    label: 'Pack 14 audit records gcloud auth environment gate',
    file: 'docs/audits/2026-05-06-PACK14_PRODUCTION_EXCELLENCE_PASS.md',
    mustInclude: ['audit:gcp', 'interactive reauthentication'],
  },
];

const failures: string[] = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  if (!existsSync(fullPath)) {
    failures.push(`${check.label}: missing ${check.file}`);
    continue;
  }
  const body = readFileSync(fullPath, 'utf8');
  for (const expected of check.mustInclude) {
    if (!body.includes(expected)) {
      failures.push(`${check.label}: ${check.file} missing ${expected}`);
    }
  }
}

if (failures.length > 0) {
  console.error('[audit:observability-coverage] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:observability-coverage] ok (static-marker)');

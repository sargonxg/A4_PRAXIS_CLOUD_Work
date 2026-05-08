import { execSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT_ID ?? 'praxisbytacitus';
const REGION = process.env.GCP_REGION ?? 'us-central1';
const SKIP_GCLOUD = process.env.AUDIT_GCP_SKIP === '1';

interface Check {
  name: string;
  command: string[];
  requiredText?: string;
  soft?: boolean;
}

function gcloud(args: string[]): string {
  const command = ['gcloud', ...[...args, '--project', PROJECT].map(shellQuote)].join(' ');
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function shellQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

const checks: Check[] = [
  {
    name: 'Cloud Run frontend ready',
    command: ['run', 'services', 'describe', 'praxis-frontend', '--region', REGION, '--format=value(status.conditions[0].status)'],
    requiredText: 'True',
  },
  {
    name: 'Cloud Run backend ready',
    command: ['run', 'services', 'describe', 'praxis-backend', '--region', REGION, '--format=value(status.conditions[0].status)'],
    requiredText: 'True',
  },
  {
    name: 'Cloud SQL instance exists',
    command: ['sql', 'instances', 'describe', 'praxisbytacitus-instance', '--format=value(name)'],
    requiredText: 'praxisbytacitus-instance',
  },
  {
    name: 'Cloud SQL backups configured',
    command: ['sql', 'instances', 'describe', 'praxisbytacitus-instance', '--format=value(settings.backupConfiguration.enabled)'],
    requiredText: 'True',
  },
  {
    name: 'Uploads bucket exists',
    command: ['storage', 'buckets', 'describe', 'gs://praxisbytacitus-praxis-uploads', '--format=value(name)'],
    requiredText: 'praxisbytacitus-praxis-uploads',
  },
  {
    name: 'Uploads bucket public access prevention enforced',
    command: ['storage', 'buckets', 'describe', 'gs://praxisbytacitus-praxis-uploads', '--format=value(publicAccessPrevention)'],
    requiredText: 'enforced',
    soft: true,
  },
  {
    name: 'Required Vertex ADK engine secret exists',
    command: ['secrets', 'describe', 'praxis-vertex-adk-engine-id', '--format=value(name)'],
    requiredText: 'projects/',
  },
  {
    name: 'At least one scheduler job exists',
    command: ['scheduler', 'jobs', 'list', '--location', REGION, '--format=value(name)'],
  },
  {
    name: 'Terraform state bucket exists',
    command: ['storage', 'buckets', 'describe', 'gs://praxis-terraform-state', '--format=value(name)'],
    soft: true,
  },
  {
    name: 'Cloud Armor policy exists',
    command: ['compute', 'security-policies', 'list', '--format=value(name)'],
    soft: true,
  },
];

let hardFailures = 0;
let softWarnings = 0;

if (SKIP_GCLOUD) {
  console.log('AUDIT_GCP_SKIP=1 - skipping Pack 22 GCP production posture calls (runtime-proof).');
  process.exit(0);
}

for (const check of checks) {
  try {
    const output = gcloud(check.command);
    const ok = check.requiredText ? output.includes(check.requiredText) : output.length > 0;
    console.log(`${ok ? 'OK  ' : check.soft ? 'WARN' : 'FAIL'} ${check.name}${output ? `: ${output.split(/\r?\n/)[0]}` : ''} (runtime-proof)`);
    if (!ok) {
      if (check.soft) softWarnings += 1;
      else hardFailures += 1;
    }
  } catch (error) {
    console.log(`${check.soft ? 'WARN' : 'FAIL'} ${check.name}: ${error instanceof Error ? error.message : String(error)}`);
    if (check.soft) softWarnings += 1;
    else hardFailures += 1;
  }
}

console.log(`Pack 22 GCP production posture: hardFailures=${hardFailures}, softWarnings=${softWarnings} (runtime-proof)`);
if (hardFailures > 0) process.exit(1);

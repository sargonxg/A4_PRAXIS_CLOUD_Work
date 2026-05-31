#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const bin = process.env.GRAPHLITE_BIN || 'graphlite';

function run(args, options = {}) {
  const result = spawnSync(bin, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
  if (result.error) {
    throw new Error(`${bin} ${args.join(' ')} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error([
      `${bin} ${args.join(' ')} exited ${result.status}`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

const version = run(['--version']).trim();
const tempRoot = mkdtempSync(join(tmpdir(), 'praxis-graphlite-'));
const dbPath = join(tempRoot, 'db');

try {
  run(['install', '--path', dbPath, '--admin-user', 'admin', '--admin-password', 'secret']);
  const gql = `
CREATE SCHEMA /praxis;
SESSION SET SCHEMA /praxis;
CREATE GRAPH /praxis/capsules;
SESSION SET GRAPH /praxis/capsules;
INSERT (:Capsule {id: 'cap-1', label: 'PRAXIS smoke capsule'});
MATCH (c:Capsule) RETURN c.id, c.label;
EXIT
`;
  const output = run(['gql', '--path', dbPath, '-u', 'admin', '-p', 'secret'], { input: gql });
  if (!output.includes('PRAXIS smoke capsule')) {
    throw new Error(`GraphLite smoke query did not return the inserted capsule.\n${output}`);
  }
  console.log(JSON.stringify({
    ok: true,
    binary: bin,
    version,
    smoke: 'insert-and-query-pass',
  }, null, 2));
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const modulePath = require.resolve('@fastify/busboy');

// Firebase Admin uses Busboy.Dicer for multipart responses. A separate process
// bounds a regression into the old parser's infinite loop; no network is used.
describe('installed Firebase multipart parser security regressions', () => {
  it.each(['oversized boundary', 'prototype header'])('finishes parsing a %s without hanging or crashing', (caseName) => {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const { Dicer } = require(process.argv[1]);
      const boundary = process.argv[2] === 'oversized boundary' ? 'b'.repeat(252) : 'synthetic-boundary';
      const prototypeHeader = process.argv[2] === 'prototype header';
      const parser = new Dicer({ boundary });
      let body = ''; let parts = 0; let inspected = false;
      parser.on('error', error => { throw error; });
      parser.on('part', part => {
        parts++;
        part.on('error', error => { throw error; });
        part.on('header', headers => {
          assert.deepEqual(headers['content-type'], ['text/plain']);
          if (prototypeHeader) {
            assert.deepEqual(headers.constructor, ['safe']);
            assert.deepEqual(headers.__proto__, ['safe']);
          }
          inspected = true;
        });
        part.on('data', chunk => { body += chunk.toString('utf8'); });
      });
      parser.on('finish', () => {
        assert.equal(body, 'Funding remains undecided.');
        assert.equal(parts, 1); assert.equal(inspected, true);
        process.stdout.write(JSON.stringify({ body, parts, inspected }));
      });
      parser.end('--' + boundary + '\\r\\n' +
        (prototypeHeader ? 'constructor: safe\\r\\n__proto__: safe\\r\\n' : '') +
        'Content-Type: text/plain\\r\\n\\r\\nFunding remains undecided.\\r\\n--' + boundary + '--\\r\\n');
    `, modulePath, caseName], { encoding: 'utf8', timeout: 5000 });
    expect(result.error, result.stderr).toBeUndefined();
    expect(result.signal, result.stderr).toBeNull();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ body: 'Funding remains undecided.', parts: 1, inspected: true });
  });
});

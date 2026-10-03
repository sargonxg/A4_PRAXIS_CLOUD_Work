import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createDoclingBenchmarkAdapter, createGoogleDocumentAiBenchmarkAdapter, runDocumentParserBenchmark } from '../src/lib/cognitive-capsule/parser-benchmark';

async function main() {
  const args = process.argv.slice(2);
  const value = (flag: string) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
  const filePath = value('--input');
  if (!filePath) throw new Error('Supply --input LOCAL_PDF [--google-document-ai] [--python EXE --artifacts LOCAL_MODELS].');
  const bytes = await readFile(filePath);
  const documentId = value('--document-id') ?? 'local-parser-benchmark';
  const pythonExecutable = value('--python'); const artifactsPath = value('--artifacts');
  if (Boolean(pythonExecutable) !== Boolean(artifactsPath)) throw new Error('Docling requires both --python and --artifacts.');
  const report = await runDocumentParserBenchmark({ documentId, sourceVersion: `sha256:${createHash('sha256').update(bytes).digest('hex')}` }, {
    ...(args.includes('--google-document-ai') ? { 'google-document-ai': createGoogleDocumentAiBenchmarkAdapter(filePath) } : {}),
    ...(pythonExecutable && artifactsPath ? { docling: createDoclingBenchmarkAdapter({ filePath, pythonExecutable, artifactsPath }) } : {}),
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.results.some(row => row.status === 'failed')) process.exitCode = 1;
}
void main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : 'Parser benchmark failed.'}\n`); process.exitCode = 1; });

import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { buildSpatialSourceBinding, isDocumentAiLayoutParserConfigured } from '@/lib/documents/spatial-source-binding';
import { DocumentIrSchema, type DocumentIR } from './evidence';
import { contentDigest } from './integrity';

export interface ParserBenchmarkInput { documentId: string; sourceVersion: string }
export type BenchmarkParserAdapter = (input: ParserBenchmarkInput) => Promise<{ document: DocumentIR; parserVersion: string; executionReceipt: string }>;
export class ParserUnavailableError extends Error {}
export async function runDocumentParserBenchmark(input: ParserBenchmarkInput, adapters: Partial<Record<'google-document-ai' | 'docling', BenchmarkParserAdapter>> = {}) {
  const results: Array<{ parser: 'google-document-ai' | 'docling'; status: 'not-run' | 'parsed' | 'failed'; reason?: string;
    parserVersion?: string; executionReceipt?: string; documentDigest?: string; elapsedMs?: number; blockCounts?: Record<string, number>; textPosture?: DocumentIR['textPosture'] }> = [];
  const locked = structuredClone(input);
  for (const parser of ['google-document-ai', 'docling'] as const) {
    const adapter = adapters[parser];
    if (!adapter) { results.push({ parser, status: 'not-run', reason: 'No configured actual parser adapter supplied.' }); continue; }
    const start = performance.now();
    try {
      const result = await adapter(structuredClone(locked)); const document = DocumentIrSchema.parse(result.document);
      if (document.documentId !== locked.documentId || document.sourceVersion !== locked.sourceVersion) throw new Error('Parser output is outside the locked document snapshot.');
      if (!result.parserVersion.trim() || !result.executionReceipt.trim()) throw new Error('Parser completion needs version and execution receipts.');
      const blockCounts: Record<string, number> = {};
      for (const block of document.blocks) blockCounts[block.type] = (blockCounts[block.type] ?? 0) + 1;
      results.push({ parser, status: 'parsed', parserVersion: result.parserVersion, executionReceipt: result.executionReceipt,
        documentDigest: contentDigest(document), elapsedMs: performance.now() - start, blockCounts, textPosture: document.textPosture });
    } catch (error) { results.push({ parser, status: error instanceof ParserUnavailableError ? 'not-run' : 'failed', reason: error instanceof Error ? error.message : 'Parser failed.' }); }
  }
  return { benchmarkVersion: 'document-parser-benchmark/0.1.0', ...locked, results, parserQualityImprovementEstablished: false,
    interpretation: 'Actual adapter runs and structural counts only. Layout/evidence fidelity requires representative source documents and independent gold annotations.' };
}

async function lockedFile(path: string, input: ParserBenchmarkInput): Promise<Buffer> {
  if (!(await stat(path)).isFile()) throw new Error('Parser input must be a local regular file.');
  const bytes = await readFile(path); const version = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  if (version !== input.sourceVersion) throw new Error('Local file bytes do not match the locked source version.');
  return bytes;
}
export function createGoogleDocumentAiBenchmarkAdapter(filePath: string): BenchmarkParserAdapter | undefined {
  if (process.env.DOCUMENT_AI_LAYOUT_PARSER_ENABLED !== 'true' || !isDocumentAiLayoutParserConfigured()) return undefined;
  return async input => {
    const fileBuffer = await lockedFile(filePath, input);
    const binding = await buildSpatialSourceBinding({ ownerUid: 'local-parser-benchmark', situationId: 'local-parser-benchmark',
      documentId: input.documentId, filename: filePath, fileType: 'pdf', mimeType: 'application/pdf', text: '', fileBuffer });
    if (binding.parser !== 'document-ai-layout-parser') throw new Error('Configured Document AI did not produce a document; fallback is not a Google parser benchmark.');
    const document = DocumentIrSchema.parse(binding.metadata.documentIr);
    return { document, parserVersion: binding.parserVersion, executionReceipt: `document-ai-local-receipt:${contentDigest(document)}` };
  };
}
/** Optional local Docling process. Explicit executable and local model artifacts prevent implicit installation/downloads. */
export function createDoclingBenchmarkAdapter(options: { filePath: string; pythonExecutable: string; artifactsPath: string; scriptPath?: string }): BenchmarkParserAdapter {
  const exec = promisify(execFile);
  return async input => {
    await lockedFile(options.filePath, input);
    let artifactsAvailable = false;
    try { artifactsAvailable = (await stat(options.artifactsPath)).isDirectory(); } catch { /* Absent optional artifacts remain not-run. */ }
    if (!artifactsAvailable) throw new ParserUnavailableError('Docling local model artifacts directory is unavailable.');
    const script = options.scriptPath ?? resolve('scripts/docling-document-ir.py');
    const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV ?? 'test', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', HF_DATASETS_OFFLINE: '1', PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' };
    for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE']) if (process.env[key]) env[key] = process.env[key];
    const { stdout } = await exec(options.pythonExecutable, [script, '--input', resolve(options.filePath), '--document-id', input.documentId,
      '--source-version', input.sourceVersion, '--artifacts', resolve(options.artifactsPath)], { env, windowsHide: true, timeout: 120000, maxBuffer: 16 * 1024 * 1024 });
    const result = JSON.parse(stdout) as { status?: string; reason?: string; document: DocumentIR; parserVersion: string; executionReceipt: string };
    if (result.status === 'unavailable') throw new ParserUnavailableError(result.reason ?? 'Docling is unavailable.');
    return { document: DocumentIrSchema.parse(result.document), parserVersion: result.parserVersion, executionReceipt: result.executionReceipt };
  };
}

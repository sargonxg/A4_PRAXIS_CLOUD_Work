import { execFile } from 'node:child_process';
import path from 'node:path';

export interface RustSemanticaValidationResult {
  nodeCount: number;
  edgeCount: number;
  hasContextRoot: boolean;
  hasDomainOntology: boolean;
  hasWorkOntology: boolean;
  orphanEdgeCount: number;
  semanticaReady: boolean;
}

export interface RustSemanticaCliResponse {
  ok: boolean;
  engine: 'praxis-semantica-core-rust';
  version: string;
  result?: RustSemanticaValidationResult;
  error?: string;
}

const DEFAULT_BINARY_PATH = process.platform === 'win32'
  ? path.join(/*turbopackIgnore: true*/ process.cwd(), 'rust', 'semantica-core', 'target-ci', 'debug', 'praxis-semantica-core.exe')
  : '/app/bin/praxis-semantica-core';

export function getRustSemanticaBinaryPath(): string {
  return process.env.PRAXIS_SEMANTICA_CORE_BIN || DEFAULT_BINARY_PATH;
}

export async function validateWithRustSemanticaCore(graph: unknown): Promise<RustSemanticaCliResponse> {
  const binary = getRustSemanticaBinaryPath();
  const payload = JSON.stringify(graph);
  return new Promise((resolve, reject) => {
    const child = execFile(binary, { timeout: 4_000, maxBuffer: 128_000 }, (error, stdout, stderr) => {
      const text = stdout.trim();
      if (!text) {
        reject(new Error(stderr.trim() || error?.message || 'Rust semantic validator returned no output'));
        return;
      }
      try {
        const parsed = JSON.parse(text) as RustSemanticaCliResponse;
        if (error && parsed.ok) {
          reject(error);
          return;
        }
        resolve(parsed);
      } catch (parseError) {
        reject(parseError);
      }
    });
    child.stdin?.end(payload);
  });
}

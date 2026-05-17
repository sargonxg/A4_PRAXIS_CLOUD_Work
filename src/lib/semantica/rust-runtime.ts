import { spawn } from 'node:child_process';

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

export function getRustSemanticaBinaryPath(): string {
  if (process.env.PRAXIS_SEMANTICA_CORE_BIN) return process.env.PRAXIS_SEMANTICA_CORE_BIN;
  if (process.platform !== 'win32') return '/app/bin/praxis-semantica-core';
  return 'rust\\semantica-core\\target-ci\\debug\\praxis-semantica-core.exe';
}

export async function validateWithRustSemanticaCore(graph: unknown): Promise<RustSemanticaCliResponse> {
  const binary = getRustSemanticaBinaryPath();
  const payload = JSON.stringify(graph);
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Rust semantic validator timed out'));
    }, 4_000);

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => errorChunks.push(chunk));
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      const stdout = Buffer.concat(chunks).toString('utf8');
      const stderr = Buffer.concat(errorChunks).toString('utf8');
      const text = stdout.trim();
      if (!text) {
        reject(new Error(stderr.trim() || `Rust semantic validator returned no output (exit=${code ?? 'unknown'}, signal=${signal ?? 'none'})`));
        return;
      }
      try {
        const parsed = JSON.parse(text) as RustSemanticaCliResponse;
        if (code && parsed.ok) {
          reject(new Error(`Rust semantic validator exited ${code} after ok response`));
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

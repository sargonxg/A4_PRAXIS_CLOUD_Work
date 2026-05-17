import { describe, expect, it } from 'vitest';
import { getRustSemanticaBinaryPath } from '@/lib/semantica/rust-runtime';

describe('Rust Semantica runtime', () => {
  it('scopes the default Windows binary path under the repo rust folder', () => {
    const previous = process.env.PRAXIS_SEMANTICA_CORE_BIN;
    delete process.env.PRAXIS_SEMANTICA_CORE_BIN;
    try {
      const path = getRustSemanticaBinaryPath();
      if (process.platform === 'win32') {
        expect(path).toContain('rust');
        expect(path).toContain('semantica-core');
        expect(path).toContain('praxis-semantica-core.exe');
        expect(path).not.toBe('rust\\semantica-core\\target-ci\\debug\\praxis-semantica-core.exe');
      } else {
        expect(path).toBe('/app/bin/praxis-semantica-core');
      }
    } finally {
      if (previous === undefined) delete process.env.PRAXIS_SEMANTICA_CORE_BIN;
      else process.env.PRAXIS_SEMANTICA_CORE_BIN = previous;
    }
  });
});

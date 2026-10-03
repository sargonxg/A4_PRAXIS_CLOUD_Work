import { afterEach, expect, it, vi } from 'vitest';
import { register } from '@/instrumentation';
import { initTracing } from '@/lib/observability/tracing';
vi.mock('@/lib/observability/tracing', () => ({ initTracing: vi.fn() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('does not load cloud tracing in the synthetic emulator lane', async () => {
  vi.stubEnv('NEXT_RUNTIME', 'nodejs'); vi.stubEnv('PRAXIS_LOCAL_EMULATORS', 'true');
  await register(); expect(initTracing).not.toHaveBeenCalled();
});

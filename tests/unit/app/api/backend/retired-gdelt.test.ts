import { describe, expect, it } from 'vitest';
import { retiredGdeltIngestResponse } from '@/app/api/backend/[...path]/route';

describe('retired GDELT compatibility guard', () => {
  it('returns an intentional no-op response for legacy worker calls', () => {
    expect(retiredGdeltIngestResponse()).toEqual({
      ok: true,
      status: 'retired',
      route: 'pipeline/ingest-gdelt',
      message: 'GDELT ingestion is retired; request acknowledged without work.',
    });
  });
});

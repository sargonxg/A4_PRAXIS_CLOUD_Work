import { describe, expect, it } from 'vitest';
import { resolveGenkitGoogleProvider } from '@/lib/genkit/provider';

describe('Genkit Google provider resolution', () => {
  it('uses Vertex when explicitly requested', () => {
    expect(resolveGenkitGoogleProvider({
      AI_PROVIDER: 'vertex',
      GOOGLE_VERTEX_PROJECT: 'praxisbytacitus',
      GOOGLE_VERTEX_LOCATION: 'us-central1',
    })).toMatchObject({
      kind: 'vertex',
      projectId: 'praxisbytacitus',
      location: 'us-central1',
    });
  });

  it('uses Vertex when only Google Cloud project auth is available', () => {
    expect(resolveGenkitGoogleProvider({
      GOOGLE_CLOUD_PROJECT: 'praxisbytacitus',
    })).toMatchObject({
      kind: 'vertex',
      projectId: 'praxisbytacitus',
    });
  });

  it('keeps Google AI Studio as the local API-key fallback', () => {
    expect(resolveGenkitGoogleProvider({
      GOOGLE_AI_API_KEY: 'test-key',
      GOOGLE_VERTEX_PROJECT: 'praxisbytacitus',
    })).toMatchObject({
      kind: 'google-ai',
      apiKey: 'test-key',
    });
  });
});

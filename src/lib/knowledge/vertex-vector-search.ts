import { GoogleAuth } from 'google-auth-library';

export interface VertexVectorNeighbor {
  datapointId: string;
  distance: number | null;
}

interface FindNeighborsResponse {
  nearestNeighbors?: Array<{
    neighbors?: Array<{
      distance?: number;
      datapoint?: {
        datapointId?: string;
        datapoint_id?: string;
      };
    }>;
  }>;
}

function config() {
  const indexEndpoint = process.env.VERTEX_VECTOR_SEARCH_INDEX_ENDPOINT;
  const deployedIndexId = process.env.VERTEX_VECTOR_SEARCH_DEPLOYED_INDEX_ID;
  const publicEndpointHost = process.env.VERTEX_VECTOR_SEARCH_ENDPOINT_HOST;
  const location = process.env.VERTEX_VECTOR_SEARCH_LOCATION
    || process.env.GOOGLE_VERTEX_LOCATION
    || 'us-central1';
  return { indexEndpoint, deployedIndexId, publicEndpointHost, location };
}

export function isVertexVectorSearchConfigured(): boolean {
  const { indexEndpoint, deployedIndexId } = config();
  return Boolean(indexEndpoint && deployedIndexId);
}

export async function findVertexVectorNeighbors(input: {
  featureVector: number[];
  neighborCount: number;
}): Promise<VertexVectorNeighbor[]> {
  const { indexEndpoint, deployedIndexId, publicEndpointHost, location } = config();
  if (!indexEndpoint || !deployedIndexId) return [];

  const host = publicEndpointHost
    ? publicEndpointHost.replace(/\/$/, '')
    : `https://${location}-aiplatform.googleapis.com`;
  const url = `${host}/v1/${indexEndpoint}:findNeighbors`;
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === 'string' ? token : token.token;
  if (!accessToken) throw new Error('Vertex Vector Search auth failed: no access token available.');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      deployedIndexId,
      queries: [
        {
          datapoint: { featureVector: input.featureVector },
          neighborCount: Math.max(1, Math.min(100, Math.floor(input.neighborCount))),
        },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Vertex Vector Search query failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  const body = await response.json() as FindNeighborsResponse;
  const neighbors = body.nearestNeighbors?.[0]?.neighbors ?? [];
  return neighbors
    .map((neighbor) => ({
      datapointId: neighbor.datapoint?.datapointId ?? neighbor.datapoint?.datapoint_id ?? '',
      distance: typeof neighbor.distance === 'number' ? neighbor.distance : null,
    }))
    .filter((neighbor) => neighbor.datapointId);
}

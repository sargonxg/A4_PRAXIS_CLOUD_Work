export interface Neo4jSyncRequest {
  situationId: string;
}

export async function requestNeo4jSync(body: Neo4jSyncRequest): Promise<{ ok: boolean }> {
  const res = await fetch('/api/graph/neo4j-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Neo4j sync request failed: ${res.status}`);
  return res.json();
}

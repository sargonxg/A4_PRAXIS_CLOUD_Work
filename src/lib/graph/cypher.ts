export interface CypherValidationResult {
  ok: boolean;
  error?: string;
}

const FORBIDDEN_CYPHER = /\b(CREATE|MERGE|SET|DELETE|DETACH|REMOVE|DROP|CALL\s+dbms|CALL\s+apoc|LOAD\s+CSV|FOREACH)\b/i;

export function validateReadOnlyCypher(cypher: string): CypherValidationResult {
  const trimmed = cypher.trim();
  if (!trimmed) return { ok: false, error: 'Cypher query is required.' };
  if (trimmed.length > 5000) return { ok: false, error: 'Cypher query is too long.' };
  if (!/^(MATCH|OPTIONAL MATCH|WITH|RETURN|UNWIND)\b/i.test(trimmed)) {
    return { ok: false, error: 'Only read-only Cypher queries are allowed.' };
  }
  if (FORBIDDEN_CYPHER.test(trimmed)) {
    return { ok: false, error: 'Query rejected: read-only console forbids write or procedure tokens.' };
  }
  if (!/\bRETURN\b/i.test(trimmed)) {
    return { ok: false, error: 'Read-only Cypher must include RETURN.' };
  }
  return { ok: true };
}

export function tenantScopeCypher(cypher: string): string {
  const trimmed = cypher.trim().replace(/;+\s*$/, '');
  if (/\$tenantId\b/.test(trimmed)) return trimmed;
  return `${trimmed}\n// tenantId is bound server-side as $tenantId for Neo4j execution.`;
}

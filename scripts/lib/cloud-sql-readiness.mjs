/** Read-only SQL Admin v1beta4 checks. Tokens stay in memory and errors omit response bodies. */
export function createCloudSqlReadinessReader({ project, instance, getAccessToken, fetchFn = globalThis.fetch }) {
  const base = `https://sqladmin.googleapis.com/sql/v1beta4/projects/${encodeURIComponent(project)}/instances/${encodeURIComponent(instance)}`;
  const responses = new Map();
  let token;
  async function read(suffix) {
    if (!responses.has(suffix)) responses.set(suffix, (async () => {
      if (!token) {
        try { token = getAccessToken().trim(); } catch { throw new Error('Unable to acquire Cloud SQL audit identity.'); }
        if (!token) throw new Error('Unable to acquire Cloud SQL audit identity.');
      }
      const response = await fetchFn(base + suffix, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`Cloud SQL audit read ${suffix || '/instance'} returned HTTP ${response.status}.`);
      let body;
      try { body = await response.json(); } catch { throw new Error('Invalid Cloud SQL audit response.'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid Cloud SQL audit response.');
      if (suffix && (!Array.isArray(body.items ?? []) || (body.items ?? []).some((row) => !row || typeof row.name !== 'string'))) throw new Error('Invalid Cloud SQL audit list response.');
      return body;
    })());
    return responses.get(suffix);
  }
  return {
    hasInstance: async () => (await read('')).name === instance,
    hasDatabase: async (name) => ((await read('/databases')).items ?? []).some((row) => row.name === name),
    hasUser: async (name) => ((await read('/users')).items ?? []).some((row) => row.name === name),
  };
}

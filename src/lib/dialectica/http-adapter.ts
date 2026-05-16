export class HttpDialecticaAdapter {
  constructor(private readonly baseUrl: string, private readonly enabled = false) {}

  capabilities() {
    return { mode: 'http', baseUrl: this.baseUrl, provenance: true };
  }

  async reason(recipe: string, payload: unknown) {
    if (!this.enabled) throw new Error('not enabled');
    const response = await fetch(`${this.baseUrl}/reason/${recipe}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Dialectica HTTP adapter failed: ${response.status}`);
    return response.json();
  }
}

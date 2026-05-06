export function withFirewallHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Praxis-Firewall', headers.get('X-Praxis-Firewall') ?? 'shared-calibration-boundary');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

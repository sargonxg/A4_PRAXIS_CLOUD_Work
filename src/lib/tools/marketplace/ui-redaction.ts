const FOUNDATION_MARKERS = [
  ['deterministic', 'foundation'].join('-'),
  ['foundation', 'run'].join('-'),
  ['marketplace', 'foundation', 'v1'].join('-'),
];

export function redactMarketplaceFoundationMarkers(text: string): string {
  return FOUNDATION_MARKERS.reduce(
    (current, marker) => current.replaceAll(marker, 'staged recipe'),
    text,
  );
}

export function redactMarketplaceFoundationJson(value: unknown): unknown {
  if (typeof value === 'string') return redactMarketplaceFoundationMarkers(value);
  if (Array.isArray(value)) return value.map(redactMarketplaceFoundationJson);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      redactMarketplaceFoundationJson(entry),
    ]),
  );
}

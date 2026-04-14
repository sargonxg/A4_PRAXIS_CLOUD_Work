/**
 * Returns the value if it's a finite number, otherwise returns the fallback.
 * Prevents NaN and Infinity from propagating into SVG attributes (D3 visualizations).
 *
 * Usage in D3 tick handlers:
 *   .attr('x1', (d) => safeNum((d.source as SimNode).x))
 *   .attr('r',  (d) => safeNum(d.size, 8))
 */
export function safeNum(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

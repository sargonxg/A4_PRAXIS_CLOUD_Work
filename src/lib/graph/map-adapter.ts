import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';

export function toMapPoints(graph: WorkbenchGraph) {
  return graph.nodes
    .filter((node) => node.geo)
    .map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      description: node.description,
      confidence: node.confidence,
      latitude: node.geo?.latitude ?? 0,
      longitude: node.geo?.longitude ?? 0,
      derived: node.geo?.derived ?? true,
      locationLabel: node.geo?.label ?? node.label,
      node,
    }));
}

export function mapCenter(points: ReturnType<typeof toMapPoints>) {
  if (points.length === 0) return { latitude: 20, longitude: 0, zoom: 1.5 };
  const latitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const longitude = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
  return {
    latitude: Number(latitude.toFixed(5)),
    longitude: Number(longitude.toFixed(5)),
    zoom: points.length > 1 ? 4.2 : 5.2,
  };
}

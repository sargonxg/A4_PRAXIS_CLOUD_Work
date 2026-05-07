'use client';

import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';
import { useMemo, useState } from 'react';
import { GraphEntityPanel } from '@/components/graph/GraphEntityPanel';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import { mapCenter, toMapPoints } from '@/lib/graph/map-adapter';

export function PraxisMapReact({ graph }: { graph: WorkbenchGraph }) {
  const points = useMemo(() => toMapPoints(graph), [graph]);
  const center = useMemo(() => mapCenter(points), [points]);
  const [activeId, setActiveId] = useState(points[0]?.id ?? null);
  const activePoint = points.find((point) => point.id === activeId) ?? null;
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const styleUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/dataviz/style.json?key=${mapTilerKey}`
    : 'https://demotiles.maplibre.org/style.json';

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <Map
          initialViewState={{ latitude: center.latitude, longitude: center.longitude, zoom: center.zoom }}
          style={{ width: '100%', height: 480 }}
          mapStyle={styleUrl}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" />
          {points.map((point) => (
            <Marker key={point.id} latitude={point.latitude} longitude={point.longitude} anchor="center">
              <button
                type="button"
                onClick={() => setActiveId(point.id)}
                className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gold-500 text-[10px] font-bold text-navy-950 shadow-lg shadow-navy-950/25 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-navy-950"
                aria-label={`Select ${point.label}`}
              >
                {point.type.slice(0, 1).toUpperCase()}
              </button>
            </Marker>
          ))}
          {activePoint ? (
            <Popup
              latitude={activePoint.latitude}
              longitude={activePoint.longitude}
              closeButton={false}
              closeOnClick={false}
              offset={22}
              anchor="top"
            >
              <div className="max-w-[220px] p-1 text-navy-950">
                <p className="text-xs font-semibold">{activePoint.label}</p>
                <p className="mt-1 text-[11px] leading-4 text-slate-700">{activePoint.description}</p>
                {activePoint.derived ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-amber-800">Derived regional anchor</p> : null}
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>
      <GraphEntityPanel node={activePoint?.node ?? null} compact />
    </div>
  );
}

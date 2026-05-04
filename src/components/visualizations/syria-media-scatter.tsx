'use client';

/**
 * D3 reliability × orientation scatter for the Syria source library.
 *
 * Each source from SYRIA_SOURCES_LIBRARY (and the curated local Syrian
 * media set) is plotted with reliability on the x-axis and political
 * orientation on the y-axis. Color encodes source category. Tooltip shows
 * use-case + caveats. Helps the analyst defend source diversity in a brief.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SYRIA_SOURCES_LIBRARY } from '@/lib/constants/syria-tool-demos';
import { SYRIA_LOCAL_MEDIA_SOURCES } from '@/lib/constants/syria-demo-workspace';
import { cn } from '@/lib/utils/cn';

interface ScatterPoint {
  id: string;
  name: string;
  reliability: number; // 0..100
  orientation: number; // -1..+1
  category: string;
  url?: string;
  proximity?: number;
  useCase?: string;
  risk?: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  'UN': '#1e40af',
  'UN humanitarian': '#0ea5e9',
  'UN diplomatic': '#312e81',
  'UN strategic': '#0369a1',
  'Humanitarian': '#06b6d4',
  'Independent local': '#10b981',
  'Local regional': '#16a34a',
  'Specialist economic': '#a16207',
  'Civic storytelling': '#7c3aed',
  'Translation digest': '#9333ea',
  'Official messaging': '#dc2626',
  'Conflict monitoring': '#ea580c',
  'Conflict analysis': '#0891b2',
  'Policy research': '#2563eb',
  'European policy': '#3730a3',
  'Strategic analysis': '#1d4ed8',
  'Regional policy': '#4338ca',
  'International affairs': '#1e3a8a',
  'Rights': '#db2777',
  'IHL / detention': '#be185d',
  'Medical / humanitarian': '#0d9488',
  'Shelter / HLP / education': '#059669',
  'Multi-sector': '#15803d',
  'Child-focused': '#65a30d',
  'Civil defense': '#ca8a04',
  'Medical relief': '#0e7490',
  'Wire': '#475569',
  'Pan-Arab': '#9d174d',
  'Saudi-aligned': '#831843',
  'Public broadcaster': '#334155',
  'Quality press': '#525252',
};

interface SyriaMediaScatterProps {
  height?: number;
  className?: string;
}

export function SyriaMediaScatter({ height = 380, className }: SyriaMediaScatterProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<ScatterPoint | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.max(360, entry.contentRect.width));
    });
    obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  const points: ScatterPoint[] = useMemo(() => {
    const sources: ScatterPoint[] = SYRIA_SOURCES_LIBRARY.map((s) => ({
      id: s.id,
      name: s.name,
      reliability: s.reliability,
      orientation: 0,
      category: s.category,
      url: s.url,
    }));
    // Local media sources carry richer orientation + proximity + use case.
    const local: ScatterPoint[] = SYRIA_LOCAL_MEDIA_SOURCES.map((s) => ({
      id: 'sy-local-' + s.name,
      name: s.name,
      reliability: s.reliability,
      orientation: s.orientationScore,
      category: s.posture.includes('state') || s.type === 'state' ? 'Official messaging' : 'Independent local',
      url: s.url,
      proximity: s.proximity,
      useCase: s.useCase,
      risk: s.risks,
    }));
    // De-dupe by name (local list takes precedence for richer data)
    const byName = new Map<string, ScatterPoint>();
    sources.forEach((p) => byName.set(p.name, p));
    local.forEach((p) => byName.set(p.name, p));
    return Array.from(byName.values());
  }, []);

  const margin = { top: 20, right: 16, bottom: 36, left: 48 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(220, height - margin.top - margin.bottom);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;
    svg.selectAll('*').remove();

    const xScale = d3.scaleLinear().domain([30, 100]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([innerHeight, 0]);

    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Background quadrant tint (high reliability + neutral orientation = preferred)
    root
      .append('rect')
      .attr('x', xScale(70))
      .attr('y', yScale(0.35))
      .attr('width', innerWidth - xScale(70))
      .attr('height', yScale(-0.35) - yScale(0.35))
      .attr('fill', '#10b981')
      .attr('opacity', 0.06);

    // Axes
    root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(7).tickFormat((d) => `${d}%`))
      .selectAll('text')
      .attr('font-size', 9)
      .attr('fill', '#64748b');
    root
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => {
            const v = d as number;
            if (v <= -0.6) return 'Far left';
            if (v <= -0.2) return 'Left';
            if (v >= 0.6) return 'Far right';
            if (v >= 0.2) return 'Right';
            return 'Centre';
          }),
      )
      .selectAll('text')
      .attr('font-size', 9)
      .attr('fill', '#64748b');

    // Axis labels
    svg
      .append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('fill', '#475569')
      .text('Reliability →');
    svg
      .append('text')
      .attr('transform', `translate(12,${margin.top + innerHeight / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('fill', '#475569')
      .text('Orientation');

    // Centre line
    root
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#cbd5e1')
      .attr('stroke-dasharray', '2 4');

    root
      .append('g')
      .selectAll<SVGCircleElement, ScatterPoint>('circle')
      .data(points)
      .join('circle')
      .attr('cx', (d) => xScale(Math.max(30, d.reliability)))
      .attr('cy', (d) => yScale(d.orientation))
      .attr('r', 6)
      .attr('fill', (d) => CATEGORY_COLOR[d.category] ?? '#64748b')
      .attr('opacity', 0.85)
      .attr('stroke', '#0f172a')
      .attr('stroke-opacity', 0.18)
      .attr('stroke-width', 0.6)
      .style('cursor', 'pointer')
      .on('mouseover', (_, d) => setHover(d))
      .on('mouseout', () => setHover(null));

    root
      .append('g')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('font-size', 8.5)
      .attr('fill', '#1e293b')
      .selectAll<SVGTextElement, ScatterPoint>('text')
      .data(points.filter((p) => p.reliability >= 75 || Math.abs(p.orientation) >= 0.18))
      .join('text')
      .attr('x', (d) => xScale(Math.max(30, d.reliability)) + 8)
      .attr('y', (d) => yScale(d.orientation) + 3)
      .text((d) => (d.name.length > 26 ? d.name.slice(0, 26) + '…' : d.name));
  }, [points, innerWidth, innerHeight, height, margin.left, margin.top]);

  // Distinct categories for legend
  const legend = useMemo(() => {
    const set = new Set(points.map((p) => p.category));
    return Array.from(set).sort();
  }, [points]);

  return (
    <div ref={wrapperRef} className={cn('relative rounded-xl border border-slate-200 bg-white p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-diplomatic-blue">Syria source landscape</p>
          <h3 className="mt-1 font-serif text-base font-semibold text-navy-900">Reliability × political orientation — public-source map</h3>
          <p className="mt-1 text-[11px] text-navy-500">
            Green band marks the high-reliability + neutral-orientation zone PRAXIS prefers for principal-level claims. Hover for source detail.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 max-w-md">
          {legend.slice(0, 14).map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[cat] ?? '#64748b' }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="mt-3 h-[380px] w-full" />
      {hover ? (
        <div className="absolute right-4 top-4 max-w-xs rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-semibold text-navy-900">{hover.name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-diplomatic-blue">{hover.category}</p>
          <p className="mt-1 text-[11px] text-navy-600">Reliability {hover.reliability}% · Orientation {hover.orientation.toFixed(2)}{hover.proximity ? ` · Proximity ${hover.proximity}` : ''}</p>
          {hover.useCase ? <p className="mt-1 text-[11px] text-navy-700">{hover.useCase}</p> : null}
          {hover.risk ? <p className="mt-1 text-[11px] text-rose-700">Caveat: {hover.risk}</p> : null}
          {hover.url ? (
            <a href={hover.url} target="_blank" rel="noopener" className="mt-1 inline-block text-[11px] text-diplomatic-blue underline">
              Open source
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

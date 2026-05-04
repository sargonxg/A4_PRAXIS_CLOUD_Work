'use client';

/**
 * D3 timeline chart for the Syria post-Assad case.
 *
 * Two-row visual:
 * - Top: dot strip per category (Military, Political, Diplomatic, Humanitarian, Economic)
 *   with marker size keyed to significance.
 * - Bottom: Glasl escalation band (1–9) for events that carry a stage.
 *
 * Renders deterministically from SYRIA_TIMELINE_EVENTS — no API call.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SYRIA_TIMELINE_EVENTS, type SyriaTimelineEvent } from '@/lib/constants/syria-tool-demos';
import { cn } from '@/lib/utils/cn';

const CATEGORIES = ['Military', 'Political', 'Diplomatic', 'Humanitarian', 'Economic'] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLOR: Record<Category, string> = {
  Military: '#ef4444',
  Political: '#3b82f6',
  Diplomatic: '#14b8a6',
  Humanitarian: '#f59e0b',
  Economic: '#10b981',
};

const SIGNIFICANCE_RADIUS: Record<string, number> = {
  critical: 7,
  high: 5,
  medium: 3.5,
  low: 2.5,
};

interface SyriaTimelineChartProps {
  height?: number;
  className?: string;
}

export function SyriaTimelineChart({ height = 320, className }: SyriaTimelineChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<SyriaTimelineEvent | null>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.max(360, entry.contentRect.width));
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  const events = useMemo(
    () =>
      SYRIA_TIMELINE_EVENTS.map((e) => ({
        ...e,
        dateObj: new Date(e.date + 'T00:00:00Z'),
      })),
    [],
  );

  const margin = { top: 24, right: 16, bottom: 32, left: 96 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const topAreaHeight = Math.max(120, height * 0.55);
  const escalationHeight = Math.max(60, height - topAreaHeight - margin.top - margin.bottom);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;
    svg.selectAll('*').remove();

    const dates = events.map((e) => e.dateObj);
    const xScale = d3
      .scaleTime()
      .domain([d3.min(dates) ?? new Date(), d3.max(dates) ?? new Date()])
      .range([0, innerWidth])
      .nice();

    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis
    root
      .append('g')
      .attr('transform', `translate(0,${topAreaHeight + escalationHeight + 8})`)
      .attr('class', 'syria-x-axis')
      .call(
        d3
          .axisBottom<Date>(xScale)
          .ticks(6)
          .tickFormat((d) => d3.timeFormat('%b %Y')(d as Date)),
      );

    // Category labels (left)
    const yPerCategory = (cat: Category) => {
      const idx = CATEGORIES.indexOf(cat);
      const slot = topAreaHeight / CATEGORIES.length;
      return idx * slot + slot / 2;
    };
    CATEGORIES.forEach((cat) => {
      root
        .append('text')
        .attr('x', -8)
        .attr('y', yPerCategory(cat) + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .attr('fill', '#475569')
        .text(cat);
      root
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yPerCategory(cat))
        .attr('y2', yPerCategory(cat))
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '2 4');
    });

    // Event dots
    const tooltip = d3.select(wrapperRef.current).select('.syria-timeline-tooltip');
    root
      .append('g')
      .selectAll<SVGCircleElement, (typeof events)[number]>('circle')
      .data(events)
      .join('circle')
      .attr('cx', (d) => xScale(d.dateObj))
      .attr('cy', (d) => yPerCategory(d.category as Category))
      .attr('r', (d) => SIGNIFICANCE_RADIUS[d.significance] ?? 3)
      .attr('fill', (d) => CATEGORY_COLOR[d.category as Category])
      .attr('stroke', '#0f172a')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 0.6)
      .style('cursor', 'pointer')
      .on('mouseover', (_, d) => {
        setHover(d);
      })
      .on('mouseout', () => {
        setHover(null);
        tooltip.style('opacity', 0);
      });

    // Glasl band
    const glaslEvents = events.filter((e) => typeof e.glaslStage === 'number');
    const yGlasl = d3.scaleLinear().domain([1, 9]).range([escalationHeight, 0]);
    const glaslG = root
      .append('g')
      .attr('transform', `translate(0,${topAreaHeight})`);

    glaslG
      .append('text')
      .attr('x', -8)
      .attr('y', 12)
      .attr('text-anchor', 'end')
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('fill', '#475569')
      .text('Glasl');

    glaslG
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', escalationHeight)
      .attr('fill', 'url(#syriaGlaslGradient)')
      .attr('opacity', 0.18);

    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'syriaGlaslGradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#dc2626');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#f59e0b');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    glaslG
      .append('g')
      .call(
        d3
          .axisLeft(yGlasl)
          .ticks(4)
          .tickFormat((d) => `S${d}`),
      )
      .selectAll('text')
      .attr('font-size', 9)
      .attr('fill', '#64748b');

    const glaslLine = d3
      .line<(typeof glaslEvents)[number]>()
      .x((d) => xScale(d.dateObj))
      .y((d) => yGlasl(d.glaslStage ?? 5))
      .curve(d3.curveMonotoneX);

    glaslG
      .append('path')
      .datum(glaslEvents)
      .attr('fill', 'none')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.4)
      .attr('d', glaslLine);

    glaslG
      .append('g')
      .selectAll<SVGCircleElement, (typeof glaslEvents)[number]>('circle')
      .data(glaslEvents)
      .join('circle')
      .attr('cx', (d) => xScale(d.dateObj))
      .attr('cy', (d) => yGlasl(d.glaslStage ?? 5))
      .attr('r', 3)
      .attr('fill', '#0f172a');
  }, [events, innerWidth, topAreaHeight, escalationHeight, margin.left, margin.top]);

  return (
    <div ref={wrapperRef} className={cn('relative rounded-xl border border-slate-200 bg-white p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-diplomatic-blue">Syria escalation timeline</p>
          <h3 className="mt-1 font-serif text-base font-semibold text-navy-900">Five months of decision-relevant events</h3>
          <p className="mt-1 text-[11px] text-navy-500">Marker size encodes significance. Lower band shows Glasl escalation stage where applicable.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
              {c}
            </span>
          ))}
        </div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="mt-3 h-[320px] w-full" />
      {hover ? (
        <div className="absolute right-4 top-4 max-w-xs rounded-md border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-[10px] font-mono text-navy-400">{hover.date}</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{hover.title}</p>
          <p className="mt-1 text-[11px] text-navy-600">{hover.description}</p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-navy-400">
            {hover.category} · {hover.significance}{hover.glaslStage ? ` · Glasl ${hover.glaslStage}` : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}

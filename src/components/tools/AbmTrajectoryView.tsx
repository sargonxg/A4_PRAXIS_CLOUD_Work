'use client';

export interface AbmTrajectoryPoint {
  step: number;
  avg_aggression: number;
  ceasefire_pressure?: number;
}

export function AbmTrajectoryView({ trajectory }: { trajectory: AbmTrajectoryPoint[] }) {
  const points = trajectory.length > 0 ? trajectory : [{ step: 0, avg_aggression: 0 }];
  const width = 640;
  const height = 220;
  const xMax = Math.max(1, ...points.map((point) => point.step));
  const y = (value: number) => height - 24 - Math.max(0, Math.min(1, value)) * (height - 48);
  const x = (step: number) => 28 + (step / xMax) * (width - 56);
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.step)} ${y(point.avg_aggression)}`).join(' ');

  return (
    <figure className="rounded-lg border border-slate-200 bg-white p-4">
      <figcaption className="mb-3 text-sm font-semibold text-slate-900">Scenario stress-test trajectory</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Average aggression over time">
        <line x1="28" y1={height - 24} x2={width - 28} y2={height - 24} stroke="#CBD5E1" />
        <line x1="28" y1="24" x2="28" y2={height - 24} stroke="#CBD5E1" />
        <path d={path} fill="none" stroke="#B45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={point.step} cx={x(point.step)} cy={y(point.avg_aggression)} r="2.5" fill="#B45309" />
        ))}
      </svg>
      <p className="text-xs leading-5 text-slate-600">
        This is a scenario stress-test under explicit assumptions, not a prediction or forecast.
      </p>
    </figure>
  );
}

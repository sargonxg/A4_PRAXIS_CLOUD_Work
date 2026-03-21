import { cn } from '@/lib/utils/cn';

const PRODUCT_CONFIG = {
  ARGUS: { color: '#10B981', label: 'ARGUS' },
  CONCORDIA: { color: '#8B5CF6', label: 'CONCORDIA' },
  WIND_TUNNEL: { color: '#F59E0B', label: 'WIND TUNNEL' },
  DIALECTICA: { color: '#06B6D4', label: 'DIALECTICA' },
  CONFLICT_COMPASS: { color: '#3B82F6', label: 'CONFLICT COMPASS' },
} as const;

interface EcosystemBadgeProps {
  product: 'ARGUS' | 'CONCORDIA' | 'WIND_TUNNEL' | 'DIALECTICA' | 'CONFLICT_COMPASS';
  size?: 'sm' | 'md';
}

export function EcosystemBadge({ product, size = 'sm' }: EcosystemBadgeProps) {
  const config = PRODUCT_CONFIG[product];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' && 'text-[9px] px-1.5 py-0.5',
        size === 'md' && 'text-[11px] px-2 py-1'
      )}
      style={{
        color: config.color,
        borderColor: `${config.color}33`,
        backgroundColor: `${config.color}1a`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

import type { LucideIcon } from 'lucide-react';
import { Card } from './card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-subtle">{label}</p>
          <p className={cn('mt-1 text-2xl font-semibold', accent ? 'text-brand' : 'text-white')}>
            {loading ? '—' : (value ?? '—')}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
        </div>
        {Icon ? <Icon size={18} className="text-subtle" /> : null}
      </div>
    </Card>
  );
}

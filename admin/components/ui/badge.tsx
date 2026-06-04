import { cn } from '@/lib/utils';

const TONES = {
  default: 'bg-card text-muted',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  brand: 'bg-brand/15 text-brand',
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = 'default', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone])}>
      {children}
    </span>
  );
}

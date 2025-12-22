import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  className?: string;
  color?: 'green' | 'red' | 'amber';
}

const colorClasses = {
  green: 'bg-success',
  red: 'bg-destructive',
  amber: 'bg-warning',
};

export function LiveIndicator({ className, color = 'green' }: LiveIndicatorProps) {
  return (
    <span
      className={cn(
        "pulse-dot",
        colorClasses[color],
        className
      )}
    />
  );
}

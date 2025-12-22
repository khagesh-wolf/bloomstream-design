import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'status-pending' },
  preparing: { label: 'Preparing', className: 'status-preparing' },
  ready: { label: 'Ready', className: 'status-ready' },
  served: { label: 'Served', className: 'status-served' },
  paid: { label: 'Paid', className: 'status-paid' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive border border-destructive/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

import { useEffect, useState } from 'react';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { cn } from '@/lib/utils';
import { wsSync } from '@/lib/websocketSync';

interface SyncStatusProps {
  className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean>(wsSync.isConnected());

  useEffect(() => {
    const id = window.setInterval(() => {
      setIsConnected(wsSync.isConnected());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const label = isConnected ? 'Connected' : 'Disconnected';
  const color: 'green' | 'red' = isConnected ? 'green' : 'red';

  return (
    <div className={cn('hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5', className)}>
      <LiveIndicator color={color} />
      <div className="leading-tight">
        <div className="text-xs font-medium text-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">Database</div>
      </div>
    </div>
  );
}

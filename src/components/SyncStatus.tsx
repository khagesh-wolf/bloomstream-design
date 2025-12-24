import { useEffect, useMemo, useState } from 'react';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { cn } from '@/lib/utils';
import { wsSync } from '@/lib/websocketSync';
import { formatDistanceToNowStrict } from 'date-fns';

interface SyncStatusProps {
  className?: string;
}

function readMode() {
  return (localStorage.getItem('backend_mode') as 'local' | 'backend') || 'local';
}

function readLastSync() {
  return localStorage.getItem('backend_last_sync');
}

export function SyncStatus({ className }: SyncStatusProps) {
  const [mode, setMode] = useState<'local' | 'backend'>(readMode());
  const [isConnected, setIsConnected] = useState<boolean>(wsSync.isConnected());
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(readLastSync());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'backend_mode') setMode(readMode());
      if (e.key === 'backend_last_sync') setLastSyncAt(readLastSync());
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIsConnected(wsSync.isConnected());
      setMode(readMode());
      setLastSyncAt(readLastSync());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const label = useMemo(() => {
    if (mode === 'local') return 'Local';
    return isConnected ? 'Backend' : 'Backend (offline)';
  }, [mode, isConnected]);

  const subLabel = useMemo(() => {
    if (mode !== 'backend') return null;
    if (!lastSyncAt) return 'No sync yet';
    const d = new Date(lastSyncAt);
    if (Number.isNaN(d.getTime())) return 'Last sync unknown';
    return `Synced ${formatDistanceToNowStrict(d, { addSuffix: true })}`;
  }, [mode, lastSyncAt]);

  const color: 'green' | 'red' | 'amber' = mode === 'local' ? 'amber' : isConnected ? 'green' : 'red';

  return (
    <div className={cn('hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5', className)}>
      <LiveIndicator color={color} />
      <div className="leading-tight">
        <div className="text-xs font-medium text-foreground">{label}</div>
        {subLabel && <div className="text-[11px] text-muted-foreground">{subLabel}</div>}
      </div>
    </div>
  );
}

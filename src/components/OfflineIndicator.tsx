import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

/**
 * Shows offline status and pending sync count
 */
export function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOfflineSync();

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all",
        isOnline 
          ? "bg-primary text-primary-foreground" 
          : "bg-warning text-warning-foreground"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode</span>
        </>
      ) : pendingSyncCount > 0 ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing {pendingSyncCount} item{pendingSyncCount > 1 ? 's' : ''}...</span>
        </>
      ) : null}
    </div>
  );
}

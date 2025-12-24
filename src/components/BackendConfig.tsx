import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, WifiOff, RefreshCw, Settings2 } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from '@/lib/apiClient';
import { useBackendSync } from '@/hooks/useBackendSync';
import { toast } from 'sonner';

export function BackendConfig() {
  const { mode, switchMode, isConnected, isLoading, error, reconnect } = useBackendSync();
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const healthy = await checkBackendHealth();
      if (healthy) {
        toast.success('Backend server is reachable!');
      } else {
        toast.error('Backend server is not responding');
      }
    } catch {
      toast.error('Failed to connect to backend');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveUrl = () => {
    if (serverUrl !== getApiBaseUrl()) {
      setApiBaseUrl(serverUrl);
      toast.success('Server URL updated. Reloading...');
    }
  };

  const handleModeSwitch = async (checked: boolean) => {
    const newMode = checked ? 'backend' : 'local';
    await switchMode(newMode);
    toast.success(`Switched to ${newMode === 'backend' ? 'SQLite Backend' : 'Local Storage'} mode`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Server className="h-4 w-4" />
          {mode === 'backend' ? (
            isConnected ? (
              <Badge variant="default" className="bg-green-500">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )
          ) : (
            <Badge variant="secondary">Local</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Backend Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use SQLite Backend</Label>
              <p className="text-sm text-muted-foreground">
                Enable cross-device sync via local server
              </p>
            </div>
            <Switch
              checked={mode === 'backend'}
              onCheckedChange={handleModeSwitch}
              disabled={isLoading}
            />
          </div>

          {/* Server URL */}
          <div className="space-y-2">
            <Label>Server URL</Label>
            <div className="flex gap-2">
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3001"
                disabled={mode === 'local'}
              />
              <Button
                variant="outline"
                onClick={handleSaveUrl}
                disabled={mode === 'local' || serverUrl === getApiBaseUrl()}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your backend server's IP address and port
            </p>
          </div>

          {/* Connection Status */}
          {mode === 'backend' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reconnect}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Local Mode:</strong> Data stored in browser (single device)</p>
            <p><strong>Backend Mode:</strong> Data synced across all devices on network</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

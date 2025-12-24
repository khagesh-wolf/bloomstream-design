import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { wsSync } from '@/lib/websocketSync';
import {
  menuApi,
  ordersApi,
  billsApi,
  customersApi,
  staffApi,
  settingsApi,
  expensesApi,
  waiterCallsApi,
  transactionsApi,
  checkBackendHealth,
  getApiBaseUrl,
} from '@/lib/apiClient';
import { Loader2, Server, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  const store = useStore();

  const loadDataFromBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        throw new Error('Backend server is not reachable');
      }

      // Connect WebSocket for real-time updates
      wsSync.connect();

      // Fetch all data from backend
      const [menuItems, orders, bills, customers, staff, settings, expenses, waiterCalls, transactions] = await Promise.all([
        menuApi.getAll().catch(() => []),
        ordersApi.getAll().catch(() => []),
        billsApi.getAll().catch(() => []),
        customersApi.getAll().catch(() => []),
        staffApi.getAll().catch(() => []),
        settingsApi.get().catch(() => null),
        expensesApi.getAll().catch(() => []),
        waiterCallsApi.getAll().catch(() => []),
        transactionsApi.getAll().catch(() => []),
      ]);

      // Update store with backend data
      store.setMenuItems(menuItems || []);
      store.setOrders(orders || []);
      store.setBills(bills || []);
      store.setCustomers(customers || []);
      store.setStaff(staff || []);
      store.setSettings(settings);
      store.setExpenses(expenses || []);
      store.setWaiterCalls(waiterCalls || []);
      store.setTransactions(transactions || []);
      store.setDataLoaded(true);

      console.log('[DataProvider] Successfully loaded data from backend');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend';
      setError(message);
      console.error('[DataProvider] Connection error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // Set up WebSocket event handlers for real-time updates
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Connection status handler
    unsubscribers.push(
      wsSync.on('connection', (data) => {
        console.log('[DataProvider] WebSocket connection status:', data.status);
        if (data.status === 'connected') {
          loadDataFromBackend();
        }
      })
    );

    // Menu updates
    unsubscribers.push(
      wsSync.on('MENU_UPDATE', async () => {
        console.log('[DataProvider] Received MENU_UPDATE');
        const menuItems = await menuApi.getAll();
        store.setMenuItems(menuItems);
      })
    );

    // Staff updates
    unsubscribers.push(
      wsSync.on('STAFF_UPDATE', async () => {
        console.log('[DataProvider] Received STAFF_UPDATE');
        const staff = await staffApi.getAll();
        store.setStaff(staff);
      })
    );

    // Order updates
    unsubscribers.push(
      wsSync.on('ORDER_UPDATE', async () => {
        console.log('[DataProvider] Received ORDER_UPDATE');
        const orders = await ordersApi.getAll();
        store.setOrders(orders);
      })
    );

    // Bill updates
    unsubscribers.push(
      wsSync.on('BILL_UPDATE', async () => {
        console.log('[DataProvider] Received BILL_UPDATE');
        const [bills, transactions] = await Promise.all([
          billsApi.getAll(),
          transactionsApi.getAll(),
        ]);
        store.setBills(bills);
        store.setTransactions(transactions);
      })
    );

    // Customer updates
    unsubscribers.push(
      wsSync.on('CUSTOMER_UPDATE', async () => {
        console.log('[DataProvider] Received CUSTOMER_UPDATE');
        const customers = await customersApi.getAll();
        store.setCustomers(customers);
      })
    );

    // Waiter call updates
    unsubscribers.push(
      wsSync.on('WAITER_CALL', async () => {
        console.log('[DataProvider] Received WAITER_CALL');
        const waiterCalls = await waiterCallsApi.getAll();
        store.setWaiterCalls(waiterCalls);
      })
    );

    // Settings updates
    unsubscribers.push(
      wsSync.on('SETTINGS_UPDATE', async () => {
        console.log('[DataProvider] Received SETTINGS_UPDATE');
        const settings = await settingsApi.get();
        store.setSettings(settings);
      })
    );

    // Expense updates
    unsubscribers.push(
      wsSync.on('EXPENSE_UPDATE', async () => {
        console.log('[DataProvider] Received EXPENSE_UPDATE');
        const expenses = await expensesApi.getAll();
        store.setExpenses(expenses);
      })
    );

    // Initial load
    loadDataFromBackend();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [loadDataFromBackend, store]);

  const handleSaveUrl = () => {
    localStorage.setItem('api_base_url', serverUrl);
    toast.success('Server URL updated. Reconnecting...');
    setShowConfig(false);
    loadDataFromBackend();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Connecting to server...</p>
          <p className="text-xs text-muted-foreground">{getApiBaseUrl()}</p>
        </div>
      </div>
    );
  }

  // Error state - show configuration
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <WifiOff className="h-16 w-16 mx-auto text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Cannot Connect to Server</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>

          {showConfig ? (
            <div className="space-y-4 text-left">
              <div>
                <label className="text-sm font-medium">Server URL</label>
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.100:3001"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your backend server's IP address and port
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfig(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveUrl} className="flex-1">
                  Save & Connect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={loadDataFromBackend} className="w-full gap-2">
                <Server className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => setShowConfig(true)} className="w-full">
                Change Server URL
              </Button>
              <p className="text-xs text-muted-foreground">
                Current: {getApiBaseUrl()}
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p className="font-medium mb-2">Make sure:</p>
            <ul className="text-left space-y-1 text-xs">
              <li>• Backend server is running (node backend/server.js)</li>
              <li>• Server URL uses the correct IP address</li>
              <li>• Both devices are on the same network</li>
              <li>• Firewall allows port 3001</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

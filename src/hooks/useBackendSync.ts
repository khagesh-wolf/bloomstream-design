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
} from '@/lib/apiClient';

export type BackendMode = 'local' | 'backend';

const LAST_SYNC_KEY = 'backend_last_sync';

export const useBackendSync = () => {
  const [mode, setMode] = useState<BackendMode>(() => {
    return (localStorage.getItem('backend_mode') as BackendMode) || 'local';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => localStorage.getItem(LAST_SYNC_KEY));

  const store = useStore();

  const markSynced = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_KEY, now);
    setLastSyncAt(now);
  }, []);

  // Connect to backend and sync initial data
  const connectToBackend = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthy = await checkBackendHealth();
      if (!healthy) {
        throw new Error('Backend server is not reachable');
      }

      // Connect WebSocket
      wsSync.connect();

      // Fetch initial data from backend
      const [menuItems, orders, bills, customers, staff, settings, expenses, waiterCalls, transactions] = await Promise.all([
        menuApi.getAll(),
        ordersApi.getAll(),
        billsApi.getAll(),
        customersApi.getAll(),
        staffApi.getAll(),
        settingsApi.get(),
        expensesApi.getAll(),
        waiterCallsApi.getAll(),
        transactionsApi.getAll(),
      ]);

      // If backend has no menu items but local store does, push local menu to backend
      // This ensures the first device to connect seeds the database
      const localMenuItems = store.menuItems;
      if ((!menuItems || menuItems.length === 0) && localMenuItems.length > 0) {
        console.log('[BackendSync] Backend has no menu items, pushing local menu to backend...');
        for (const item of localMenuItems) {
          try {
            await menuApi.create(item);
          } catch (err) {
            console.error('[BackendSync] Failed to push menu item:', item.name, err);
          }
        }
        // Keep local menu items since we just pushed them
        useStore.setState({
          orders: orders || [],
          bills: bills || [],
          customers: customers || [],
          staff: staff.length > 0 ? staff : store.staff,
          settings: settings || store.settings,
          expenses: expenses || [],
          waiterCalls: waiterCalls || [],
          transactions: transactions || [],
        });
      } else {
        // Update store with backend data
        useStore.setState({
          menuItems: menuItems || [],
          orders: orders || [],
          bills: bills || [],
          customers: customers || [],
          staff: staff.length > 0 ? staff : store.staff,
          settings: settings || store.settings,
          expenses: expenses || [],
          waiterCalls: waiterCalls || [],
          transactions: transactions || [],
        });
      }

      setIsConnected(true);
      markSynced();
      console.log('[BackendSync] Successfully synced with backend');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend';
      setError(message);
      console.error('[BackendSync] Connection error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [store.settings, store.menuItems, store.staff, markSynced]);

  // Switch between local and backend mode
  const switchMode = useCallback(async (newMode: BackendMode) => {
    localStorage.setItem('backend_mode', newMode);
    setMode(newMode);

    if (newMode === 'backend') {
      await connectToBackend();
    } else {
      wsSync.disconnect();
      setIsConnected(false);
    }
  }, [connectToBackend]);

  // Set up WebSocket event handlers
  useEffect(() => {
    if (mode !== 'backend') return;

    const unsubscribers: (() => void)[] = [];

    // Connection status handler
    unsubscribers.push(
      wsSync.on('connection', (data) => {
        setIsConnected(data.status === 'connected');
        if (data.status === 'connected') {
          // Refresh data on reconnection
          connectToBackend();
        }
      })
    );

    // Menu updates
    unsubscribers.push(
      wsSync.on('MENU_UPDATE', async () => {
        const menuItems = await menuApi.getAll();
        useStore.setState({ menuItems });
        markSynced();
      })
    );

    // Order updates
    unsubscribers.push(
      wsSync.on('ORDER_UPDATE', async () => {
        const orders = await ordersApi.getAll();
        useStore.setState({ orders });
        markSynced();
      })
    );

    // Bill updates
    unsubscribers.push(
      wsSync.on('BILL_UPDATE', async () => {
        const [bills, transactions] = await Promise.all([
          billsApi.getAll(),
          transactionsApi.getAll(),
        ]);
        useStore.setState({ bills, transactions });
        markSynced();
      })
    );

    // Customer updates
    unsubscribers.push(
      wsSync.on('CUSTOMER_UPDATE', async () => {
        const customers = await customersApi.getAll();
        useStore.setState({ customers });
        markSynced();
      })
    );

    // Waiter call updates (server broadcasts 'WAITER_CALL')
    unsubscribers.push(
      wsSync.on('WAITER_CALL', async () => {
        const waiterCalls = await waiterCallsApi.getAll();
        useStore.setState({ waiterCalls });
        markSynced();
      })
    );

    // Settings updates
    unsubscribers.push(
      wsSync.on('SETTINGS_UPDATE', async () => {
        const settings = await settingsApi.get();
        useStore.setState({ settings });
        markSynced();
      })
    );

    // Expense updates
    unsubscribers.push(
      wsSync.on('EXPENSE_UPDATE', async () => {
        const expenses = await expensesApi.getAll();
        useStore.setState({ expenses });
        markSynced();
      })
    );

    // Initial connection
    connectToBackend();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [mode, connectToBackend, markSynced]);

  return {
    mode,
    switchMode,
    isConnected,
    isLoading,
    error,
    lastSyncAt,
    reconnect: connectToBackend,
  };
};

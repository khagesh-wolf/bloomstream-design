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

export const useBackendSync = () => {
  const [mode, setMode] = useState<BackendMode>(() => {
    return (localStorage.getItem('backend_mode') as BackendMode) || 'local';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const store = useStore();

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

      // Update store with backend data
      useStore.setState({
        menuItems: menuItems || [],
        orders: orders || [],
        bills: bills || [],
        customers: customers || [],
        staff: staff || [],
        settings: settings || store.settings,
        expenses: expenses || [],
        waiterCalls: waiterCalls || [],
        transactions: transactions || [],
      });

      setIsConnected(true);
      console.log('[BackendSync] Successfully synced with backend');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend';
      setError(message);
      console.error('[BackendSync] Connection error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [store.settings]);

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
      })
    );

    // Order updates
    unsubscribers.push(
      wsSync.on('ORDER_UPDATE', async () => {
        const orders = await ordersApi.getAll();
        useStore.setState({ orders });
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
      })
    );

    // Customer updates
    unsubscribers.push(
      wsSync.on('CUSTOMER_UPDATE', async () => {
        const customers = await customersApi.getAll();
        useStore.setState({ customers });
      })
    );

    // Waiter call updates
    unsubscribers.push(
      wsSync.on('WAITER_CALL_UPDATE', async () => {
        const waiterCalls = await waiterCallsApi.getAll();
        useStore.setState({ waiterCalls });
      })
    );

    // Initial connection
    connectToBackend();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [mode, connectToBackend]);

  // Sync store actions to backend when in backend mode
  const syncToBackend = useCallback(async (action: string, data: any) => {
    if (mode !== 'backend') return;

    try {
      switch (action) {
        case 'addMenuItem':
          await menuApi.create(data);
          break;
        case 'updateMenuItem':
          await menuApi.update(data.id, data);
          break;
        case 'deleteMenuItem':
          await menuApi.delete(data.id);
          break;
        case 'addOrder':
          await ordersApi.create(data);
          break;
        case 'updateOrderStatus':
          await ordersApi.updateStatus(data.id, data.status);
          break;
        case 'createBill':
          await billsApi.create(data);
          break;
        case 'payBill':
          await billsApi.pay(data.id, data.paymentMethod);
          break;
        case 'callWaiter':
          await waiterCallsApi.create(data);
          break;
        case 'acknowledgeWaiterCall':
          await waiterCallsApi.acknowledge(data.id);
          break;
        case 'dismissWaiterCall':
          await waiterCallsApi.dismiss(data.id);
          break;
        case 'addExpense':
          await expensesApi.create(data);
          break;
        case 'deleteExpense':
          await expensesApi.delete(data.id);
          break;
        case 'updateSettings':
          await settingsApi.update(data);
          break;
        case 'addStaff':
          await staffApi.create(data);
          break;
        case 'updateStaff':
          await staffApi.update(data.id, data);
          break;
        case 'deleteStaff':
          await staffApi.delete(data.id);
          break;
        case 'addOrUpdateCustomer':
          await customersApi.upsert(data);
          break;
      }
    } catch (err) {
      console.error('[BackendSync] Failed to sync action:', action, err);
      throw err;
    }
  }, [mode]);

  return {
    mode,
    switchMode,
    isConnected,
    isLoading,
    error,
    syncToBackend,
    reconnect: connectToBackend,
  };
};

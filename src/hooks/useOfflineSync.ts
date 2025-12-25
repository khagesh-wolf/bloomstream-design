import { useEffect, useState, useCallback } from 'react';
import { offlineStorage, BackgroundSync } from '@/lib/offlineStorage';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

/**
 * Hook to manage offline data synchronization
 * - Caches menu and categories for offline access
 * - Syncs pending orders when back online
 * - Provides offline status
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  
  const { menuItems, categories, settings } = useStore();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You\'re offline. Orders will be synced when connected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache data whenever it changes
  useEffect(() => {
    if (menuItems.length > 0) {
      offlineStorage.cacheMenuItems(menuItems).catch(console.error);
    }
  }, [menuItems]);

  useEffect(() => {
    if (categories.length > 0) {
      offlineStorage.cacheCategories(categories).catch(console.error);
    }
  }, [categories]);

  useEffect(() => {
    if (settings) {
      offlineStorage.cacheSetting('appSettings', settings).catch(console.error);
    }
  }, [settings]);

  // Check for cached data on mount
  useEffect(() => {
    offlineStorage.hasCachedData().then(setHasCachedData);
  }, []);

  // Update pending sync count
  useEffect(() => {
    const updateCount = async () => {
      const queue = await offlineStorage.getSyncQueue();
      setPendingSyncCount(queue.length);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Start background sync
  useEffect(() => {
    const cleanup = BackgroundSync.startAutoSync();
    return cleanup;
  }, []);

  // Load cached data (for offline startup)
  const loadCachedData = useCallback(async () => {
    try {
      const [cachedMenu, cachedCategories, cachedSettings] = await Promise.all([
        offlineStorage.getMenuItems(),
        offlineStorage.getCategories(),
        offlineStorage.getSetting('appSettings')
      ]);

      return {
        menuItems: cachedMenu,
        categories: cachedCategories,
        settings: cachedSettings
      };
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return null;
    }
  }, []);

  // Queue an order for offline sync
  const queueOfflineOrder = useCallback(async (orderData: any) => {
    const id = await offlineStorage.addToSyncQueue({
      type: 'order',
      data: orderData
    });
    
    setPendingSyncCount(prev => prev + 1);
    toast.info('Order saved offline. Will sync when connected.');
    
    return id;
  }, []);

  return {
    isOnline,
    hasCachedData,
    pendingSyncCount,
    loadCachedData,
    queueOfflineOrder
  };
}

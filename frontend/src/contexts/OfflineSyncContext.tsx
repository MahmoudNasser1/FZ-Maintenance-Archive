import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSyncStatus, updatePendingChangesCount, setupConnectionMonitoring, SyncStatusItem } from '../services/offlineStorage';

interface OfflineSyncContextType {
  isOnline: boolean;
  syncStatus: SyncStatusItem | null;
  pendingChanges: number;
  fetchSyncStatus: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextType>({
  isOnline: true,
  syncStatus: null,
  pendingChanges: 0,
  fetchSyncStatus: async () => {}
});

export const useOfflineSync = () => useContext(OfflineSyncContext);

interface OfflineSyncProviderProps {
  children: ReactNode;
}

export const OfflineSyncProvider: React.FC<OfflineSyncProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatusItem | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);

  const fetchSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      if (status) {
        setSyncStatus(status);
        setPendingChanges(status.pendingChanges);
      } else {
        setPendingChanges(await updatePendingChangesCount());
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  // مراقبة حالة الاتصال
  useEffect(() => {
    const cleanup = setupConnectionMonitoring(
      () => setIsOnline(false),
      () => {
        setIsOnline(true);
        // محاولة المزامنة عند استعادة الاتصال إذا كان هناك تغييرات معلقة
        if (pendingChanges > 0) {
          fetchSyncStatus();
        }
      }
    );

    return cleanup;
  }, [pendingChanges]);

  // جلب حالة المزامنة عند تحميل التطبيق
  useEffect(() => {
    fetchSyncStatus();

    // تحديث الحالة كل دقيقة
    const interval = setInterval(fetchSyncStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // التأكد من تحديث عدد التغييرات المعلقة عند تحميل الصفحة
  useEffect(() => {
    const updateChangeCount = async () => {
      const count = await updatePendingChangesCount();
      setPendingChanges(count);
    };

    updateChangeCount();
  }, []);

  const value = {
    isOnline,
    syncStatus,
    pendingChanges,
    fetchSyncStatus
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
};

export default OfflineSyncContext;

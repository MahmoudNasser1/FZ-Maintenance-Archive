import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  initDB,
  getSyncStatus,
  updatePendingChangesCount,
  synchronize,
  setupConnectionMonitoring
} from '../services/offlineStorage';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingChanges: number;
  syncError: string | null;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
  apiBaseUrl: string;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children, apiBaseUrl }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // تهيئة قاعدة البيانات المحلية وتحميل حالة المزامنة
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        await updateSyncStatus();
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };
    
    initialize();
  }, []);
  
  // تحديث حالة المزامنة
  const updateSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      if (status) {
        setLastSync(status.lastSync);
        setIsSyncing(status.status === 'syncing');
        setPendingChanges(status.pendingChanges);
        setSyncError(status.error || null);
      }
      
      // تحديث عداد التغييرات المعلقة
      const count = await updatePendingChangesCount();
      setPendingChanges(count);
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  };
  
  // إعداد مراقبة حالة الاتصال
  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      // محاولة المزامنة عند استعادة الاتصال
      syncNow();
    };
    
    const cleanup = setupConnectionMonitoring(handleOffline, handleOnline);
    
    // تحديث حالة المزامنة كل دقيقة
    const interval = setInterval(updateSyncStatus, 60000);
    
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);
  
  // وظيفة لبدء المزامنة يدويًا
  const syncNow = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncError(null);
      
      // في التطبيق الحقيقي، يجب الحصول على رمز المصادقة من مخزن آمن
      const authToken = localStorage.getItem('authToken') || '';
      
      const result = await synchronize(apiBaseUrl, authToken);
      
      if (!result.success) {
        setSyncError(result.message);
      }
      
      // تحديث حالة المزامنة
      await updateSyncStatus();
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Synchronization failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const contextValue: OfflineContextType = {
    isOnline,
    isSyncing,
    lastSync,
    pendingChanges,
    syncError,
    syncNow
  };
  
  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
};

// هوك مساعد لاستخدام سياق حالة الاتصال
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  
  return context;
};

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon, ArrowPathIcon, CloudIcon, CloudOfflineIcon } from '@heroicons/react/24/outline';
import { getSyncStatus, synchronize, updatePendingChangesCount, SyncStatusItem, setupConnectionMonitoring } from '../../services/offlineStorage';

interface OfflineManagerProps {
  apiBaseUrl: string;
  authToken: string;
  onSyncComplete?: () => void;
}

const OfflineManager: React.FC<OfflineManagerProps> = ({ apiBaseUrl, authToken, onSyncComplete }) => {
  const { t } = useTranslation();
  const [syncStatus, setSyncStatus] = useState<SyncStatusItem | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // جلب حالة المزامنة الحالية
  const fetchSyncStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      if (status) {
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  }, []);

  // تحديث حالة الإتصال
  const handleOnlineStatusChange = useCallback(() => {
    setIsOnline(navigator.onLine);
    
    // إذا عاد الإتصال، حاول المزامنة تلقائيًا إذا كان هناك تغييرات معلقة
    if (navigator.onLine && syncStatus?.pendingChanges && syncStatus.pendingChanges > 0) {
      fetchSyncStatus();
    }
  }, [syncStatus, fetchSyncStatus]);

  // مراقبة حالة الإتصال
  useEffect(() => {
    const cleanup = setupConnectionMonitoring(
      () => setIsOnline(false),
      () => handleOnlineStatusChange()
    );

    return cleanup;
  }, [handleOnlineStatusChange]);

  // جلب حالة المزامنة عند تحميل المكون
  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000); // تحديث كل 30 ثانية
    
    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  // وظيفة المزامنة
  const handleSync = async () => {
    if (!isOnline) {
      alert(t('offline.noConnection'));
      return;
    }

    try {
      const result = await synchronize(apiBaseUrl, authToken);
      await fetchSyncStatus();
      
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      if (result.success) {
        alert(t('offline.syncSuccess'));
      } else {
        alert(t('offline.syncError', { message: result.message }));
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert(t('offline.syncError', { message: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  if (!syncStatus) {
    return null;
  }

  return (
    <div className="offline-manager bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isOnline ? (
            <CloudIcon className="h-6 w-6 text-green-500 mr-2" />
          ) : (
            <CloudOfflineIcon className="h-6 w-6 text-yellow-500 mr-2" />
          )}
          
          <div>
            <h3 className="text-sm font-medium">
              {isOnline ? t('offline.online') : t('offline.offline')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('offline.lastSync')}: {new Date(syncStatus.lastSync).toLocaleString()}
            </p>
          </div>
        </div>
        
        {syncStatus.pendingChanges > 0 && (
          <div className="flex items-center">
            <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
              {syncStatus.pendingChanges} {t('offline.pendingChanges')}
            </span>
            
            <button
              onClick={handleSync}
              disabled={!isOnline || syncStatus.status === 'syncing'}
              className="inline-flex items-center p-1 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${syncStatus.status === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="sr-only">{t('offline.sync')}</span>
            </button>
          </div>
        )}
      </div>
      
      {syncStatus.status === 'error' && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-xs text-red-800 dark:text-red-200">
              {t('offline.syncError')}: {syncStatus.error}
            </span>
          </div>
        </div>
      )}
      
      {!isOnline && (
        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md">
          <div className="flex items-center">
            <CloudOfflineIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-xs text-yellow-800 dark:text-yellow-200">
              {t('offline.workingOffline')}
            </span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            {t('offline.changesWillSync')}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfflineManager;

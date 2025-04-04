import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CloudIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  QrCodeIcon,
  ClockIcon,
  WifiIcon // Usamos WifiIcon como reemplazo de CloudOfflineIcon
} from '@heroicons/react/24/outline';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';

// Creamos un contexto de autenticación temporal si no existe
interface AuthContextType {
  user: {
    token: string | null;
  };
  isAuthenticated: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: { token: null },
  isAuthenticated: false
});

const useAuth = () => React.useContext(AuthContext);
import {
  getSyncStatus,
  synchronizeWithTracking,
  getSyncHistory,
  getSyncQueueItems,
  clearSyncErrors
} from '../../services/offlineStorage';

// Reimportamos las interfaces que necesitamos
interface SyncStatusItem {
  key: string;
  lastSync: string;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  pendingChanges: number;
  casesCount?: number;
  notesCount?: number;
  attachmentsCount?: number;
  qrScansCount?: number;
}

interface SyncHistoryItem {
  id: string;
  timestamp: string;
  success: boolean;
  itemsSynced: number;
  message: string;
}

interface SyncQueueItem {
  id: string;
  itemType: 'case' | 'note' | 'attachment' | 'qr_scan';
  itemId: number | string;
  parentId?: number | string;
  action: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: string;
  status: 'pending' | 'processing' | 'error';
  errorMessage?: string;
  retryCount: number;
}

const OfflineSyncStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatusItem | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'queue'>('status');
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);

  // جلب حالة المزامنة
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

  // جلب تاريخ المزامنة
  const fetchSyncHistory = useCallback(async () => {
    try {
      const history = await getSyncHistory();
      setSyncHistory(history);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  }, []);

  // جلب قائمة انتظار المزامنة
  const fetchSyncQueue = useCallback(async () => {
    try {
      const queue = await getSyncQueueItems();
      setSyncQueue(queue);
    } catch (error) {
      console.error('Error fetching sync queue:', error);
    }
  }, []);

  // تحديث كل البيانات
  const refreshAllData = useCallback(() => {
    fetchSyncStatus();
    fetchSyncHistory();
    fetchSyncQueue();
  }, [fetchSyncStatus, fetchSyncHistory, fetchSyncQueue]);

  // تنفيذ المزامنة
  const handleSync = async () => {
    if (!isOnline) {
      setStatusMessage({ type: 'error', message: t('offline.noConnection') });
      return;
    }

    if (!user || !user.token) {
      setStatusMessage({ type: 'error', message: t('common.unauthorized') });
      return;
    }

    setIsSyncing(true);
    setStatusMessage({ type: 'info', message: t('offline.syncInProgress') });

    try {
      const apiBaseUrl = '/api'; // URL base de la API por defecto
      const result = await synchronizeWithTracking(apiBaseUrl, user.token);
      await refreshAllData();
      
      if (result.success) {
        setStatusMessage({ type: 'success', message: t('offline.syncSuccess') });
      } else {
        setStatusMessage({ type: 'error', message: t('offline.syncError', { message: result.message }) });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setStatusMessage({
        type: 'error',
        message: t('offline.syncError', { message: error instanceof Error ? error.message : 'Unknown error' })
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // إزالة أخطاء المزامنة
  const handleClearErrors = async () => {
    try {
      await clearSyncErrors();
      setStatusMessage({ type: 'success', message: t('offline.errorsCleared') });
      refreshAllData();
    } catch (error) {
      console.error('Error clearing sync errors:', error);
      setStatusMessage({
        type: 'error',
        message: t('offline.errorClearingErrors', { message: error instanceof Error ? error.message : 'Unknown error' })
      });
    }
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 30000); // تحديث كل 30 ثانية
    
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // عرض رسالة الحالة
  const renderStatusMessage = () => {
    if (!statusMessage) return null;

    const icon = statusMessage.type === 'success' ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : statusMessage.type === 'error' ? (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    ) : (
      <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
    );

    const bgColor = statusMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900' :
                    statusMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-blue-100 dark:bg-blue-900';

    const textColor = statusMessage.type === 'success' ? 'text-green-800 dark:text-green-200' :
                      statusMessage.type === 'error' ? 'text-red-800 dark:text-red-200' :
                      'text-blue-800 dark:text-blue-200';

    return (
      <div className={`mb-4 p-3 rounded-md ${bgColor}`}>
        <div className="flex items-center">
          {icon}
          <span className={`ml-2 text-sm ${textColor}`}>{statusMessage.message}</span>
        </div>
      </div>
    );
  };

  // عرض علامات التبويب
  const renderTabs = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
      <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
        <li className="mr-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`inline-flex items-center p-4 rounded-t-lg ${activeTab === 'status' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
          >
            <CloudIcon className="mr-2 w-5 h-5" />
            {t('offline.syncStatus')}
          </button>
        </li>
        <li className="mr-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`inline-flex items-center p-4 rounded-t-lg ${activeTab === 'queue' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
          >
            <DocumentTextIcon className="mr-2 w-5 h-5" />
            {t('offline.pendingChanges')}
            {syncQueue.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-2">
                {syncQueue.length}
              </span>
            )}
          </button>
        </li>
        <li className="mr-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center p-4 rounded-t-lg ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}`}
          >
            <ClockIcon className="mr-2 w-5 h-5" />
            {t('offline.syncHistory')}
          </button>
        </li>
      </ul>
    </div>
  );

  // عرض تبويب حالة المزامنة
  const renderStatusTab = () => {
    if (!syncStatus) {
      return (
        <div className="text-center p-8">
          <p>{t('common.loading')}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">{t('offline.connectionStatus')}</h3>
          
          <div className="flex items-center mb-4">
            {isOnline ? (
              <CloudIcon className="h-10 w-10 text-green-500 mr-4" />
            ) : (
              <WifiIcon className="h-10 w-10 text-yellow-500 mr-4" />
            )}
            
            <div>
              <p className="text-xl font-semibold">
                {isOnline ? t('offline.online') : t('offline.offline')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOnline ? t('offline.connectedToServer') : t('offline.workingOffline')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{t('offline.lastSync')}:</p>
              <p className="text-lg">{new Date(syncStatus.lastSync).toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">{t('offline.syncStatus')}:</p>
              <p className="text-lg">
                {syncStatus.status === 'idle' && t('offline.statusIdle')}
                {syncStatus.status === 'syncing' && t('offline.statusSyncing')}
                {syncStatus.status === 'error' && t('offline.statusError')}
              </p>
            </div>

            {syncStatus.error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-md">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm text-red-800 dark:text-red-200">
                    {syncStatus.error}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700 disabled:opacity-50"
            >
              {isSyncing && <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />}
              {!isSyncing && <ArrowPathIcon className="h-5 w-5 mr-2" />}
              {t('offline.syncNow')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">{t('offline.offlineData')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('offline.pendingChanges')}:</p>
              <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {syncStatus.pendingChanges}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('offline.casesAvailableOffline')}:</p>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {syncStatus.casesCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('offline.notesAvailableOffline')}:</p>
              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {syncStatus.notesCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('offline.attachmentsAvailableOffline')}:</p>
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {syncStatus.attachmentsCount || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('offline.qrCodesScannedOffline')}:</p>
              <span className="flex items-center bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                <QrCodeIcon className="h-4 w-4 mr-1" />
                {syncStatus.qrScansCount || 0}
              </span>
            </div>

            {syncStatus.status === 'error' && (
              <button
                onClick={handleClearErrors}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-700"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                {t('offline.clearSyncErrors')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // عرض تبويب قائمة انتظار المزامنة
  const renderQueueTab = () => {
    if (syncQueue.length === 0) {
      return (
        <div className="text-center p-8 bg-white dark:bg-gray-800 shadow rounded-lg">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('offline.noChanges')}</h3>
          <p className="text-gray-500 dark:text-gray-400">{t('offline.allChangesSynced')}</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-medium">{t('offline.pendingChanges')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.type')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.object')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.action')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.date')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {syncQueue.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {item.itemType === 'case' && t('case.case')}
                    {item.itemType === 'note' && t('case.note')}
                    {item.itemType === 'attachment' && t('case.attachment')}
                    {item.itemType === 'qr_scan' && t('qrCode.qrScan')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {item.itemType === 'case' && `#${item.itemId}`}
                    {item.itemType === 'note' && `${t('case.noteForCase')} #${item.parentId}`}
                    {item.itemType === 'attachment' && `${t('case.attachmentForCase')} #${item.parentId}`}
                    {item.itemType === 'qr_scan' && `${t('case.case')} #${item.itemId}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {item.action === 'create' && t('offline.actionCreate')}
                    {item.action === 'update' && t('offline.actionUpdate')}
                    {item.action === 'delete' && t('offline.actionDelete')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.status === 'pending' && (
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {t('offline.statusPending')}
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {t('offline.statusError')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // عرض تبويب تاريخ المزامنة
  const renderHistoryTab = () => {
    if (syncHistory.length === 0) {
      return (
        <div className="text-center p-8 bg-white dark:bg-gray-800 shadow rounded-lg">
          <p>{t('offline.noSyncHistory')}</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="font-medium">{t('offline.syncHistory')}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.date')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('offline.itemsSynced')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('offline.details')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {syncHistory.map(history => (
                <tr key={history.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(history.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {history.success ? (
                      <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {t('offline.syncSuccessful')}
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {t('offline.syncFailed')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {history.itemsSynced}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {history.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('offline.offlineSync')}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('offline.syncManagementDescription')}
        </p>
      </div>

      {renderStatusMessage()}
      {renderTabs()}
      
      <div className="mb-8">
        {activeTab === 'status' && renderStatusTab()}
        {activeTab === 'queue' && renderQueueTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};

export default OfflineSyncStatusPage;

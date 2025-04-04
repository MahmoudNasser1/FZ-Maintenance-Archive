import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../contexts/OfflineContext';
import { getSyncStatus, getPendingChanges } from '../../services/offlineStorage';
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertCircle, FiCheck, FiChevronRight, FiDatabase } from 'react-icons/fi';
import OfflineStatusIndicator from './OfflineStatusIndicator';

interface PendingItem {
  id: number;
  name?: string;
  type?: string;
  syncError?: string;
}

interface PendingChanges {
  cases: PendingItem[];
  notes: PendingItem[];
  attachments: PendingItem[];
}

const SyncManagementPanel: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline, syncNow, lastSyncTime } = useOffline();
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({ cases: [], notes: [], attachments: [] });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [selectedTab, setSelectedTab] = useState<'cases' | 'notes' | 'attachments'>('cases');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  // جلب التغييرات المعلقة من التخزين المحلي
  useEffect(() => {
    fetchPendingChanges();
  }, []);
  
  const fetchPendingChanges = async () => {
    try {
      // جلب تفاصيل العناصر التي تحتاج مزامنة
      const changes = await getPendingChanges();
      setPendingChanges(changes);
    } catch (error) {
      console.error('Error fetching pending changes:', error);
    }
  };
  
  // التعامل مع بدء المزامنة
  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      
      // محاكاة تقدم المزامنة
      const totalItems = pendingChanges.cases.length + pendingChanges.notes.length + pendingChanges.attachments.length;
      let processedItems = 0;
      
      const updateProgress = setInterval(() => {
        processedItems += 1;
        const progress = Math.min(Math.round((processedItems / totalItems) * 100), 95); // نتوقف عند 95% لإظهار الإنهاء النهائي
        setSyncProgress(progress);
      }, 500);
      
      // بدء المزامنة الفعلية
      await syncNow();
      
      // إنهاء المزامنة
      clearInterval(updateProgress);
      setSyncProgress(100);
      
      // تحديث قائمة التغييرات المعلقة بعد المزامنة
      setTimeout(() => {
        fetchPendingChanges();
      }, 1000);
      
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncProgress(0);
      }, 1000);
    }
  };
  
  // حساب إجمالي التغييرات المعلقة
  const totalPendingChanges = 
    pendingChanges.cases.length + 
    pendingChanges.notes.length + 
    pendingChanges.attachments.length;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* رأس اللوحة */}
      <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-blue-800">{t('sync_management')}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('sync_management_description')}
        </p>
      </div>
      
      {/* حالة المزامنة */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiDatabase className="h-5 w-5 text-gray-600 ml-2" />
            <span className="font-medium">{t('sync_status')}</span>
          </div>
          <OfflineStatusIndicator />
        </div>
      </div>
      
      {/* عرض شريط التقدم أثناء المزامنة */}
      {isSyncing && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-blue-800">{t('syncing')}</span>
              <span className="text-sm font-medium text-blue-800">{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${syncProgress}%` }}>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* التغييرات المعلقة - التبويبات */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setSelectedTab('cases')}
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${selectedTab === 'cases' ? 'text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('cases')} ({pendingChanges.cases.length})
          </button>
          <button
            onClick={() => setSelectedTab('notes')}
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${selectedTab === 'notes' ? 'text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('notes')} ({pendingChanges.notes.length})
          </button>
          <button
            onClick={() => setSelectedTab('attachments')}
            className={`flex-1 py-2 px-4 text-center text-sm font-medium ${selectedTab === 'attachments' ? 'text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('attachments')} ({pendingChanges.attachments.length})
          </button>
        </div>
      </div>
      
      {/* قائمة العناصر المعلقة */}
      <div className="p-4">
        {pendingChanges[selectedTab].length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <FiCheck className="mx-auto h-10 w-10 text-green-500 mb-2" />
            <p>{t('no_pending_changes')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingChanges[selectedTab].map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{item.name || `${t(selectedTab.slice(0, -1))} #${item.id}`}</span>
                    {item.syncError && (
                      <p className="text-sm text-red-500 mt-1">{item.syncError}</p>
                    )}
                  </div>
                  <FiChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* التحكم بالمزامنة */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
        <div>
          {lastSyncTime && (
            <p className="text-sm text-gray-600">
              {t('last_synced_at', {time: new Date(lastSyncTime).toLocaleString()})}
            </p>
          )}
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showDetails ? t('hide_details') : t('show_details')}
          </button>
          
          <button
            onClick={handleSync}
            disabled={isSyncing || !isOnline || totalPendingChanges === 0}
            className={`px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-1 rtl:space-x-reverse
              ${(isOnline && !isSyncing && totalPendingChanges > 0) 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <FiRefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('syncing') : t('sync_now')}</span>
          </button>
        </div>
      </div>
      
      {/* تفاصيل المزامنة */}
      {showDetails && (
        <div className="p-4 border-t border-gray-200 bg-gray-100">
          <h4 className="font-medium mb-2">{t('sync_details')}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t('cases')}</span>
              <span className="font-medium">{pendingChanges.cases.length}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('notes')}</span>
              <span className="font-medium">{pendingChanges.notes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('attachments')}</span>
              <span className="font-medium">{pendingChanges.attachments.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-medium">{t('total')}</span>
              <span className="font-bold">{totalPendingChanges}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncManagementPanel;

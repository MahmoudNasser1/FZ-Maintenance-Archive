import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOffline } from '../../contexts/OfflineContext';
import { getSyncStatus } from '../../services/offlineStorage';
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertCircle, FiCheck } from 'react-icons/fi';

interface OfflineStatusIndicatorProps {
  showControls?: boolean;
}

const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ showControls = false }) => {
  const { t } = useTranslation();
  const { isOnline, syncNow, lastSyncTime, syncStatus } = useOffline();
  const [pendingChanges, setPendingChanges] = useState<{ cases: number, notes: number, attachments: number }>({ cases: 0, notes: 0, attachments: 0 });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // جلب عدد التغييرات المعلقة من التخزين المحلي
  useEffect(() => {
    const fetchPendingChanges = async () => {
      try {
        const status = await getSyncStatus();
        setPendingChanges({
          cases: status.pendingCasesCount || 0,
          notes: status.pendingNotesCount || 0,
          attachments: status.pendingAttachmentsCount || 0
        });
      } catch (error) {
        console.error('Error fetching pending changes:', error);
      }
    };
    
    fetchPendingChanges();
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchPendingChanges, 30000);
    return () => clearInterval(interval);
  }, [syncStatus]); // تحديث عند تغير حالة المزامنة
  
  // التعامل مع بدء المزامنة
  const handleSync = async () => {
    if (isSyncing || !isOnline) return;
    
    try {
      setIsSyncing(true);
      await syncNow();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // حساب إجمالي التغييرات المعلقة
  const totalPendingChanges = pendingChanges.cases + pendingChanges.notes + pendingChanges.attachments;
  
  // توليد رسالة حالة المزامنة
  const getSyncMessage = () => {
    if (isSyncing) {
      return t('syncing_in_progress');
    }
    
    if (!isOnline) {
      return t('offline_mode');
    }
    
    if (totalPendingChanges > 0) {
      return t('pending_changes', { count: totalPendingChanges });
    }
    
    if (lastSyncTime) {
      const timeString = new Date(lastSyncTime).toLocaleTimeString();
      return t('last_synced_at', { time: timeString });
    }
    
    return t('all_synced');
  };
  
  // تحديد لون الحالة
  const getStatusColor = () => {
    if (!isOnline) return 'text-gray-500';
    if (isSyncing) return 'text-blue-500';
    if (totalPendingChanges > 0) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  // تحديد أيقونة الحالة
  const StatusIcon = () => {
    if (!isOnline) return <FiWifiOff className="w-5 h-5 text-gray-500" />;
    if (isSyncing) return <FiRefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    if (totalPendingChanges > 0) return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
    return <FiCheck className="w-5 h-5 text-green-500" />;
  };
  
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <div className={`flex items-center ${getStatusColor()}`}>
        <StatusIcon />
        <span className="mr-2 text-sm font-medium">{getSyncMessage()}</span>
      </div>
      
      {showControls && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {isOnline ? (
            <button
              onClick={handleSync}
              disabled={isSyncing || totalPendingChanges === 0}
              className={`px-3 py-1 text-sm rounded-md flex items-center space-x-1 rtl:space-x-reverse
                ${(!isSyncing && totalPendingChanges > 0) 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
            >
              <FiRefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{t('sync_now')}</span>
            </button>
          ) : (
            <button
              disabled
              className="px-3 py-1 text-sm bg-gray-200 text-gray-500 rounded-md flex items-center space-x-1 rtl:space-x-reverse cursor-not-allowed"
            >
              <FiWifi className="w-4 h-4" />
              <span>{t('waiting_for_connection')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;

import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, CloudDownloadIcon, CloudIcon, ServerIcon } from '@heroicons/react/24/outline';
import MainLayout from '../../layouts/MainLayout';
import OfflineManager from '../../components/common/OfflineManager';
import { getPendingChanges, getSyncStatus, synchronize } from '../../services/offlineStorage';
import { AuthContext } from '../../contexts/AuthContext';

const SyncManager: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingCases, setPendingCases] = useState<number>(0);
  const [pendingNotes, setPendingNotes] = useState<number>(0);
  const [pendingAttachments, setPendingAttachments] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || '';

  // جلب بيانات المزامنة
  const fetchSyncData = async () => {
    setIsLoading(true);
    try {
      // جلب حالة المزامنة
      const syncStatus = await getSyncStatus();
      if (syncStatus) {
        setLastSyncTime(syncStatus.lastSync);
      }
      
      // جلب التغييرات المعلقة
      const pendingChanges = await getPendingChanges();
      setPendingCases(pendingChanges.cases.length);
      setPendingNotes(pendingChanges.notes.length);
      setPendingAttachments(pendingChanges.attachments.length);
    } catch (error) {
      console.error('Error fetching sync data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  // بدء عملية المزامنة
  const handleStartSync = async () => {
    if (syncInProgress || !token) return;
    
    setSyncInProgress(true);
    try {
      const result = await synchronize(apiBaseUrl, token);
      alert(result.success ? t('sync.successMessage') : t('sync.errorMessage', { message: result.message }));
      fetchSyncData();
    } catch (error) {
      console.error('Sync error:', error);
      alert(t('sync.errorMessage', { message: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setSyncInProgress(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('sync.title')}</h1>
        
        {/* لوحة حالة المزامنة */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('sync.status')}</h2>
          
          <OfflineManager 
            apiBaseUrl={apiBaseUrl} 
            authToken={token || ''}
            onSyncComplete={fetchSyncData}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <ServerIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="font-medium">{t('sync.pendingCases')}</h3>
              </div>
              <p className="text-2xl font-bold">{pendingCases}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CloudIcon className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="font-medium">{t('sync.pendingNotes')}</h3>
              </div>
              <p className="text-2xl font-bold">{pendingNotes}</p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <CloudDownloadIcon className="h-6 w-6 text-purple-500 mr-2" />
                <h3 className="font-medium">{t('sync.pendingAttachments')}</h3>
              </div>
              <p className="text-2xl font-bold">{pendingAttachments}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleStartSync}
              disabled={syncInProgress || !navigator.onLine}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
              {syncInProgress ? t('sync.inProgress') : t('sync.startSync')}
            </button>
          </div>
        </div>
        
        {/* معلومات حول العمل دون اتصال */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('sync.offlineInfo')}</h2>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>{t('sync.offlineDescription1')}</p>
            <p>{t('sync.offlineDescription2')}</p>
            
            <h3 className="font-medium text-lg mt-4">{t('sync.howItWorks')}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('sync.offlinePoint1')}</li>
              <li>{t('sync.offlinePoint2')}</li>
              <li>{t('sync.offlinePoint3')}</li>
              <li>{t('sync.offlinePoint4')}</li>
            </ul>
            
            <h3 className="font-medium text-lg mt-4">{t('sync.limitations')}</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>{t('sync.limitationPoint1')}</li>
              <li>{t('sync.limitationPoint2')}</li>
              <li>{t('sync.limitationPoint3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SyncManager;

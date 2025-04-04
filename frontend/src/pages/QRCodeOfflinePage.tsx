import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Container, Grid, Typography, Box, Button, Divider, CircularProgress } from '@mui/material';
import { FiWifi, FiWifiOff, FiDatabase, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

import QRScanTester from '../components/testing/QRScanTester';
import { useOfflineSync } from '../contexts/OfflineSyncContext';
import { getSyncStatus, SyncStatusItem, synchronizeWithTracking } from '../services/offlineStorage';
import { getPendingQRScans } from '../services/qrSyncService';

/**
 * صفحة إدارة رموز QR في وضع عدم الاتصال
 * تعرض حالة المزامنة وتسمح بإدارة عمليات المسح غير المتزامنة
 */
const QRCodeOfflinePage: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline } = useOfflineSync();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatusItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingQRScansCount, setPendingQRScansCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // استرجاع حالة المزامنة عند تحميل الصفحة
  useEffect(() => {
    loadSyncStatus();
  }, []);
  
  // استرجاع حالة المزامنة
  const loadSyncStatus = async () => {
    setIsLoading(true);
    try {
      // استرجاع حالة المزامنة الحالية
      const status = await getSyncStatus();
      setSyncStatus(status || null);
      
      if (status?.lastSync) {
        setLastSyncTime(new Date(status.lastSync).toLocaleString());
      }
      
      // استرجاع عدد عمليات مسح رموز QR المعلقة
      const pendingScans = await getPendingQRScans();
      setPendingQRScansCount(pendingScans.length);
      
    } catch (error) {
      console.error('Error loading sync status:', error);
      setSyncMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'خطأ غير معروف أثناء تحميل حالة المزامنة'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // بدء عملية المزامنة
  const handleSync = async () => {
    if (!isOnline) {
      setSyncMessage({
        type: 'info',
        message: 'لا يمكن المزامنة في وضع عدم الاتصال. يرجى الاتصال بالإنترنت أولاً.'
      });
      return;
    }
    
    setIsSyncing(true);
    setSyncMessage({
      type: 'info',
      message: 'جاري المزامنة...'
    });
    
    try {
      // بدء عملية المزامنة
      const apiBaseUrl = process.env.REACT_APP_API_URL || '';
      const authToken = localStorage.getItem('auth_token') || '';
      
      const result = await synchronizeWithTracking(apiBaseUrl, authToken);
      
      // تحديث حالة المزامنة
      setSyncMessage({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      
      // إعادة تحميل حالة المزامنة
      await loadSyncStatus();
      
    } catch (error) {
      console.error('Error syncing data:', error);
      setSyncMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'خطأ غير معروف أثناء المزامنة'
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="mb-6 text-center font-bold">
        {t('offline.qr_offline_title')}
      </Typography>
      
      {/* بطاقة حالة الاتصال والمزامنة */}
      <Card className="mb-6 p-4">
        <Grid container spacing={3}>
          {/* حالة الاتصال */}
          <Grid item xs={12} md={4}>
            <Box className="flex flex-col items-center p-4 border-r border-gray-200 dark:border-gray-700">
              <Box className="mb-2">
                {isOnline ? (
                  <FiWifi className="text-green-500 h-8 w-8" />
                ) : (
                  <FiWifiOff className="text-yellow-500 h-8 w-8" />
                )}
              </Box>
              <Typography variant="h6" className="mb-1 font-semibold">
                {isOnline ? t('offline.online_status') : t('offline.offline_status')}
              </Typography>
              <Typography variant="body2" className="text-center text-gray-600 dark:text-gray-400">
                {isOnline ? t('offline.online_description') : t('offline.offline_description')}
              </Typography>
            </Box>
          </Grid>
          
          {/* إحصائيات المزامنة */}
          <Grid item xs={12} md={4}>
            <Box className="flex flex-col items-center p-4 border-r border-gray-200 dark:border-gray-700">
              <Box className="mb-2">
                <FiDatabase className="text-blue-500 h-8 w-8" />
              </Box>
              <Typography variant="h6" className="mb-1 font-semibold">
                {t('offline.sync_stats')}
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="body2" className="text-center mb-2">
                    <span className="font-semibold">{pendingQRScansCount}</span> {t('offline.pending_qr_scans')}
                  </Typography>
                  <Typography variant="body2" className="text-center text-gray-600 dark:text-gray-400">
                    {lastSyncTime ? (
                      <>{t('offline.last_sync')}: {lastSyncTime}</>
                    ) : (
                      t('offline.no_sync_yet')
                    )}
                  </Typography>
                </>
              )}
            </Box>
          </Grid>
          
          {/* أزرار التحكم */}
          <Grid item xs={12} md={4}>
            <Box className="flex flex-col items-center justify-center p-4">
              <Button
                variant="contained"
                color="primary"
                startIcon={<FiRefreshCw />}
                onClick={handleSync}
                disabled={isSyncing || !isOnline}
                className="mb-3 w-full"
              >
                {isSyncing ? t('offline.syncing') : t('offline.sync_now')}
              </Button>
              
              <Button
                variant="outlined"
                onClick={loadSyncStatus}
                disabled={isLoading}
                className="w-full"
              >
                {t('offline.refresh_status')}
              </Button>
              
              {syncMessage && (
                <Box className={`mt-4 p-2 rounded-lg w-full text-center ${
                  syncMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                  syncMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  <Box className="flex items-center justify-center">
                    {syncMessage.type === 'success' ? (
                      <FiCheckCircle className="mr-1" />
                    ) : syncMessage.type === 'error' ? (
                      <FiAlertCircle className="mr-1" />
                    ) : null}
                    <Typography variant="body2">{syncMessage.message}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Card>
      
      <Divider className="my-6" />
      
      {/* مكون اختبار مسح رموز QR */}
      <Typography variant="h5" component="h2" className="mb-4 font-semibold">
        {t('offline.qr_scanner_test')}
      </Typography>
      <QRScanTester />
    </Container>
  );
};

export default QRCodeOfflinePage;

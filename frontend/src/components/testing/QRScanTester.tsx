import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Divider, Button } from '@mui/material';
import { FiWifi, FiWifiOff, FiDownload, FiClipboard, FiCheck, FiAlertTriangle } from 'react-icons/fi';

import { useOfflineSync } from '../../contexts/OfflineSyncContext';
import EnhancedQRCodeScanner from '../ui/EnhancedQRCodeScanner';
import { processScannedQRCode, getPendingQRScans, syncPendingQRScans, QRScanRecord } from '../../services/qrSyncService';

/**
 * مكون اختبار مسح رموز QR في وضع عدم الاتصال
 * يسمح باختبار عملية المسح ومزامنة البيانات ويعرض المعلومات ذات الصلة
 */
const QRScanTester: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline } = useOfflineSync();
  
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; caseId?: number | string } | null>(null);
  const [pendingScans, setPendingScans] = useState<QRScanRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  
  // استرجاع عمليات المسح المعلقة عند تحميل المكون
  useEffect(() => {
    loadPendingScans();
  }, []);
  
  // استرجاع عمليات المسح المعلقة
  const loadPendingScans = async () => {
    const scans = await getPendingQRScans();
    setPendingScans(scans);
  };
  
  // فتح/إغلاق الماسح
  const toggleScanner = () => {
    setShowScanner(!showScanner);
    setScanResult(null);
  };
  
  // معالجة البيانات الممسوحة
  const handleScan = async (data: string, offline: boolean) => {
    setShowScanner(false);
    
    try {
      const result = await processScannedQRCode(data, !isOnline);
      setScanResult(result);
      
      // تحديث قائمة عمليات المسح المعلقة
      if (!isOnline) {
        await loadPendingScans();
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : 'خطأ غير معروف أثناء معالجة رمز QR'
      });
    }
  };
  
  // معالجة أخطاء المسح
  const handleScanError = (error: Error) => {
    console.error('QR scan error:', error);
    setScanResult({
      success: false,
      message: error.message || 'خطأ أثناء مسح رمز QR'
    });
    setShowScanner(false);
  };
  
  // مزامنة عمليات المسح المعلقة
  const handleSync = async () => {
    if (!isOnline) {
      setSyncResult({
        success: false,
        message: 'لا يمكن المزامنة في وضع عدم الاتصال'
      });
      return;
    }
    
    try {
      setIsSyncing(true);
      const result = await syncPendingQRScans();
      
      setSyncResult({
        success: result.success,
        message: result.success 
          ? `تمت المزامنة بنجاح. ${result.count} عملية مسح تمت مزامنتها.`
          : `فشلت المزامنة: ${result.message}`,
        timestamp: new Date().toISOString()
      });
      
      // إعادة تحميل عمليات المسح المعلقة بعد المزامنة
      await loadPendingScans();
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'خطأ غير معروف أثناء المزامنة'
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // الانتقال إلى صفحة الحالة
  const navigateToCase = (caseId: number | string) => {
    navigate(`/cases/${caseId}`);
  };
  
  // نسخ بيانات مسح QR كمرجع
  const copyQRSampleData = () => {
    const sampleData = {
      caseId: 123,
      title: "حالة صيانة تجريبية",
      caseName: "صيانة جهاز تكييف",
      clientName: "محمد أحمد",
      priority: "عالية"
    };
    
    navigator.clipboard.writeText(JSON.stringify(sampleData))
      .then(() => {
        alert(t('qr_scanner.sample_copied'));
      })
      .catch(err => {
        console.error('تعذر نسخ البيانات:', err);
      });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">{t('qr_scanner.tester_title')}</h1>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">{t('qr_scanner.connection_status')}</h2>
        <div className="flex items-center">
          {isOnline ? (
            <>
              <FiWifi className="text-green-500 h-6 w-6 mr-2" />
              <span className="text-green-700 font-medium">{t('qr_scanner.online_mode')}</span>
            </>
          ) : (
            <>
              <FiWifiOff className="text-yellow-600 h-6 w-6 mr-2" />
              <span className="text-yellow-800 font-medium">{t('qr_scanner.offline_mode')}</span>
            </>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {isOnline 
            ? t('qr_scanner.online_description')
            : t('qr_scanner.offline_description')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم الماسح */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">{t('qr_scanner.scan_section')}</h2>
          
          {showScanner ? (
            <div className="mb-4">
              <EnhancedQRCodeScanner 
                onScan={handleScan}
                onError={handleScanError}
                onClose={() => setShowScanner(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <Button 
                variant="contained" 
                color="primary"
                onClick={toggleScanner}
                className="rtl:space-x-reverse"
                startIcon={<FiCamera />}
              >
                {t('qr_scanner.open_scanner')}
              </Button>
              
              <Button
                variant="outlined"
                onClick={copyQRSampleData}
                className="rtl:space-x-reverse"
                startIcon={<FiClipboard />}
              >
                {t('qr_scanner.copy_sample')}
              </Button>
            </div>
          )}
          
          {scanResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              scanResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className="font-semibold mb-1 flex items-center">
                {scanResult.success ? (
                  <>
                    <FiCheck className="text-green-500 mr-2" />
                    <span className="text-green-800">{t('qr_scanner.scan_success')}</span>
                  </>
                ) : (
                  <>
                    <FiAlertTriangle className="text-red-500 mr-2" />
                    <span className="text-red-800">{t('qr_scanner.scan_error')}</span>
                  </>
                )}
              </h3>
              <p className="text-gray-700">{scanResult.message}</p>
              
              {scanResult.success && scanResult.caseId && (
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => navigateToCase(scanResult.caseId!)}
                  className="mt-2"
                >
                  {t('qr_scanner.view_case')}
                </Button>
              )}
            </div>
          )}
        </Card>
        
        {/* قسم المزامنة */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">{t('qr_scanner.sync_section')}</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{t('qr_scanner.pending_scans')}</span>
              <span className="text-blue-600 font-semibold">{pendingScans.length}</span>
            </div>
            
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleSync}
              disabled={isSyncing || !isOnline || pendingScans.length === 0}
              className="rtl:space-x-reverse"
              startIcon={<FiDownload />}
            >
              {isSyncing 
                ? t('qr_scanner.syncing') 
                : t('qr_scanner.sync_now')}
            </Button>
            
            {syncResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                syncResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className="text-gray-700">{syncResult.message}</p>
                {syncResult.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(syncResult.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <Divider className="my-4" />
          
          <h3 className="font-semibold mb-2">{t('qr_scanner.pending_list')}</h3>
          {pendingScans.length === 0 ? (
            <p className="text-gray-500 italic">{t('qr_scanner.no_pending_scans')}</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingScans.map((scan, index) => (
                <div 
                  key={`${scan.caseId}-${index}`}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{scan.caseName}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {scan.syncStatus === 'pending' ? t('qr_scanner.status_pending') : 
                       scan.syncStatus === 'synced' ? t('qr_scanner.status_synced') :
                       t('qr_scanner.status_error')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{new Date(scan.scanTime).toLocaleString()}</span>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigateToCase(scan.caseId)}
                    >
                      {t('qr_scanner.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// تعريف أيقونة الكاميرا
const FiCamera = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

export default QRScanTester;

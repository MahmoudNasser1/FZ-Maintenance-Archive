import { store } from '../store';
import { createQRScanNotification } from './notificationService';
import { SyncQueueItem, getSyncQueueItems, addQRScanToSyncQueue, synchronizeWithTracking } from './offlineStorage';

// واجهة تسجيل مسح رمز QR
export interface QRScanRecord {
  caseId: number | string;
  caseName: string;
  scanTime: string;
  offline: boolean;
  syncStatus?: 'pending' | 'synced' | 'error';
  errorMessage?: string;
}

/**
 * تسجيل عملية مسح رمز QR وإنشاء إشعار مناسب
 * @param caseId معرف الحالة
 * @param caseName اسم الحالة
 * @param offline هل تمت العملية في وضع عدم الاتصال
 * @returns معرف الإشعار المنشأ
 */
export const recordQRScan = async (
  caseId: number | string,
  caseName: string,
  offline: boolean = false
): Promise<string> => {
  // إنشاء إشعار لمسح رمز QR
  const notificationId = createQRScanNotification(caseName, caseId, offline);
  
  // إذا كان في وضع عدم الاتصال، إضافة إلى قائمة انتظار المزامنة
  if (offline) {
    await addQRScanToSyncQueue(caseId, caseName, true);
  } else {
    // في وضع الاتصال، يمكن إرسال البيانات مباشرة إلى الخادم إذا لزم الأمر
    try {
      await logQRScanToServer(caseId, caseName);
    } catch (error) {
      console.error('Error logging QR scan to server:', error);
      // إضافة إلى قائمة الانتظار في حالة الفشل
      await addQRScanToSyncQueue(caseId, caseName, true);
    }
  }
  
  return notificationId;
};

/**
 * إرسال سجل مسح رمز QR إلى الخادم
 * @param caseId معرف الحالة
 * @param caseName اسم الحالة
 */
const logQRScanToServer = async (caseId: number | string, caseName: string): Promise<void> => {
  // تنفيذ طلب API لتسجيل عملية المسح
  // هذه الوظيفة يمكن تنفيذها حسب API الخاص بالتطبيق
  const apiBaseUrl = process.env.REACT_APP_API_URL || '';
  const token = localStorage.getItem('auth_token') || '';
  
  if (!apiBaseUrl || !token) {
    throw new Error('API URL or auth token not available');
  }
  
  const response = await fetch(`${apiBaseUrl}/api/qr-scans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      caseId,
      caseName,
      scanTime: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to log QR scan: ${response.status} ${response.statusText}`);
  }
};

/**
 * الحصول على عمليات مسح رموز QR غير المتزامنة
 * @returns قائمة بعمليات المسح غير المتزامنة
 */
export const getPendingQRScans = async (): Promise<QRScanRecord[]> => {
  const queueItems = await getSyncQueueItems();
  const qrScans = queueItems.filter(item => item.itemType === 'qr_scan');
  
  return qrScans.map(item => ({
    caseId: item.itemId,
    caseName: item.data?.caseName || 'حالة غير معروفة',
    scanTime: item.data?.scanTime || item.timestamp,
    offline: true,
    syncStatus: item.status as 'pending' | 'synced' | 'error',
    errorMessage: item.errorMessage
  }));
};

/**
 * مزامنة جميع عمليات مسح رموز QR غير المتزامنة
 * @returns نتيجة المزامنة
 */
export const syncPendingQRScans = async (): Promise<{ success: boolean; message: string; count: number }> => {
  try {
    // استخدام آلية المزامنة المتكاملة
    const syncResult = await synchronizeWithTracking(
      process.env.REACT_APP_API_URL || '',
      localStorage.getItem('auth_token') || ''
    );
    
    // الحصول على عدد عمليات المسح التي تمت مزامنتها
    const pendingScans = await getPendingQRScans();
    
    return {
      success: syncResult.success,
      message: syncResult.message,
      count: pendingScans.length
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف أثناء المزامنة';
    console.error('Error syncing QR scans:', errorMessage);
    
    return {
      success: false,
      message: errorMessage,
      count: 0
    };
  }
};

/**
 * معالجة رمز QR الممسوح
 * @param qrData بيانات رمز QR الممسوح
 * @param isOffline هل التطبيق في وضع عدم الاتصال
 * @returns معلومات عن عملية المعالجة
 */
export const processScannedQRCode = async (
  qrData: string,
  isOffline: boolean = false
): Promise<{ success: boolean; message: string; caseId?: number | string }> => {
  try {
    // محاولة تحليل بيانات رمز QR
    const parsedData = JSON.parse(qrData);
    
    if (!parsedData.caseId) {
      return {
        success: false,
        message: 'رمز QR غير صالح أو بتنسيق غير صحيح'
      };
    }
    
    // تسجيل عملية المسح وإنشاء إشعار
    await recordQRScan(
      parsedData.caseId,
      parsedData.title || parsedData.caseName || 'حالة غير معروفة',
      isOffline
    );
    
    return {
      success: true,
      message: isOffline 
        ? 'تم مسح رمز QR وسيتم مزامنته عند استعادة الاتصال' 
        : 'تم مسح رمز QR بنجاح',
      caseId: parsedData.caseId
    };
  } catch (error) {
    console.error('Error processing QR code:', error);
    return {
      success: false,
      message: 'تعذر معالجة رمز QR. تأكد من أنه بالتنسيق الصحيح.'
    };
  }
};

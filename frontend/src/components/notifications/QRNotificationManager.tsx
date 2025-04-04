import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { BellIcon, QrCodeIcon, XMarkIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';
import { RootState } from '../../store';
import { markAsRead, markAllAsRead, removeNotification, clearAllNotifications } from '../../store/notificationSlice';
import { createQRScanNotification, Notification } from '../../services/notificationService';
import { addQRScanToSyncQueue } from '../../services/offlineStorage';

interface QRScanNotification {
  id: string;
  caseId: number | string;
  caseName: string;
  timestamp: Date;
  read: boolean;
  offline: boolean; // إذا تم المسح في وضع عدم الاتصال
}

interface QRNotificationManagerProps {
  maxNotifications?: number;
}

const QRNotificationManager: React.FC<QRNotificationManagerProps> = ({ maxNotifications = 5 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline } = useOfflineSync();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const dispatch = useDispatch();
  
  // استخدام نظام Redux للإشعارات
  const { notifications, unreadCount } = useSelector((state: RootState) => {
    const allNotifications = state.notifications.notifications;
    const qrNotifications = allNotifications.filter(n => n.type === 'qr-scan');
    return {
      notifications: qrNotifications.slice(0, maxNotifications), // أخذ العدد المحدد فقط من الإشعارات
      unreadCount: qrNotifications.filter(n => !n.read).length
    };
  });

  // طلب إذن الإشعارات عند تحميل المكون
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // إضافة إشعار جديد عند مسح رمز QR - وظيفة مرتبطة بنظام الإشعارات الجديد
  const addScanNotification = (caseId: number | string, caseName: string) => {
    // إنشاء الإشعار باستخدام خدمة الإشعارات
    const notificationId = createQRScanNotification(caseName, caseId, !isOnline);
    
    // إذا كان في وضع عدم الاتصال، قم بإضافة المسح إلى قائمة المزامنة
    if (!isOnline) {
      addQRScanToSyncQueue(caseId, caseName, true);
    }

    // عرض الإشعار المنبثق في المتصفح إذا كان مسموحًا
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = !isOnline ? 
        t('notifications.qrScannedOffline') : 
        t('notifications.qrScanned');
        
      new Notification(title, {
        body: `${caseName} ${t('notifications.caseScanned')}`,
        icon: '/logo192.png'
      });
    }
    
    return notificationId;
  };

  // تعليم جميع الإشعارات كمقروءة - باستخدام الأكشن من Redux
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // تعليم إشعار واحد كمقروء - باستخدام الأكشن من Redux
  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  // مسح إشعار واحد - باستخدام الأكشن من Redux
  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };

  // مسح جميع الإشعارات - باستخدام الأكشن من Redux
  const handleClearAllNotifications = () => {
    dispatch(clearAllNotifications());
  };

  // فتح حالة من خلال إشعار
  const navigateToCase = (caseId: number | string, notificationId: string) => {
    handleMarkAsRead(notificationId);
    navigate(`/cases/${caseId}`);
    setShowNotifications(false);
  };

  // طلب إذن الإشعارات
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert(t('notifications.notSupported'));
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert(t('notifications.permissionDenied'));
      }
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        aria-label={t('notifications.toggle')}
      >
        <BellIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-50 border dark:border-gray-700">
          <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <QrCodeIcon className="w-4 h-4 mr-2" />
              {t('notifications.qrNotifications')}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('notifications.markAllRead')}
              </button>
              <button
                onClick={handleClearAllNotifications}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                {t('notifications.clearAll')}
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-4 text-center text-gray-500 dark:text-gray-400">
                <p>{t('notifications.noNotifications')}</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 relative hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => navigateToCase(notification.caseId, notification.id)}
                        className="text-sm font-medium text-gray-900 dark:text-white text-right w-full pr-6"
                      >
                        {notification.caseName}
                      </button>
                      <button
                        onClick={() => handleRemoveNotification(notification.id)}
                        className="absolute right-2 top-3"
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.timestamp).toLocaleTimeString()} - {new Date(notification.timestamp).toLocaleDateString()}
                      </p>
                      {notification.offline && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full">
                          {t('offline.scannedOffline')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { QRNotificationManager, type QRScanNotification };

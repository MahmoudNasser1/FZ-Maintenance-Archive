// خدمة إدارة الإشعارات للتطبيق
import { store } from '../store';
import { addNotification, removeNotification } from '../store/notificationSlice';

// أنواع الإشعارات المتاحة
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'qr-scan';

// واجهة الإشعار
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number; // بالمللي ثانية، إذا كان undefined سيبقى حتى يتم إغلاقه يدوياً
  data?: any; // بيانات إضافية مرتبطة بالإشعار
  timestamp: number;
  read?: boolean;
  actionUrl?: string; // رابط للانتقال إليه عند النقر على الإشعار
}

// إنشاء إشعار جديد
export const createNotification = (
  type: NotificationType,
  message: string,
  options?: {
    title?: string;
    duration?: number;
    data?: any;
    actionUrl?: string;
  }
): string => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const notification: Notification = {
    id,
    type,
    message,
    title: options?.title,
    duration: options?.duration,
    data: options?.data,
    actionUrl: options?.actionUrl,
    timestamp: Date.now(),
    read: false
  };

  // إضافة الإشعار إلى المخزن
  store.dispatch(addNotification(notification));

  // إزالة الإشعار تلقائياً بعد المدة المحددة إذا تم تحديدها
  if (options?.duration) {
    setTimeout(() => {
      store.dispatch(removeNotification(id));
    }, options.duration);
  }

  return id;
};

// إزالة إشعار بالمعرف
export const removeNotificationById = (id: string): void => {
  store.dispatch(removeNotification(id));
};

// إنشاء إشعار لمسح رمز QR
export const createQRScanNotification = (
  caseName: string,
  caseId: number | string,
  offline: boolean = false
): string => {
  const title = offline ? 'مسح رمز QR (وضع عدم الاتصال)' : 'تم مسح رمز QR';
  const message = `تم مسح رمز QR للحالة: ${caseName}`;
  
  return createNotification('qr-scan', message, {
    title,
    duration: 5000, // 5 ثوان
    data: { caseId, offline },
    actionUrl: `/cases/${caseId}`
  });
};

// تخزين الإشعارات غير المقروءة محلياً (للاستخدام في وضع عدم الاتصال)
export const storeUnreadNotificationsLocally = (): void => {
  const { notifications } = store.getState().notifications;
  const unreadNotifications = notifications.filter(n => !n.read);
  
  localStorage.setItem('unread-notifications', JSON.stringify(unreadNotifications));
};

// استعادة الإشعارات غير المقروءة من التخزين المحلي
export const restoreUnreadNotifications = (): void => {
  const storedNotifications = localStorage.getItem('unread-notifications');
  
  if (storedNotifications) {
    try {
      const notifications: Notification[] = JSON.parse(storedNotifications);
      notifications.forEach(notification => {
        store.dispatch(addNotification(notification));
      });
    } catch (error) {
      console.error('Error restoring notifications:', error);
    }
  }
};

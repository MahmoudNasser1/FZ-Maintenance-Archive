import React from 'react';
import { useTranslation } from 'react-i18next';
import CaseQRCodeManager from './CaseQRCodeManager';

/**
 * مثال لكيفية دمج نظام رموز QR في صفحات النظام
 * 
 * يمكن استخدام هذا المكون في صفحة تفاصيل الحالة أو في القائمة الجانبية.
 * 
 * سيناريوهات الاستخدام:
 * 1. إنشاء رمز QR للحالة الحالية لمشاركتها مع الفنيين أو المديرين
 * 2. مسح رمز QR للوصول السريع إلى تفاصيل الحالة
 * 3. طباعة رمز QR وإرفاقه بالأجهزة لسهولة الوصول إلى سجل الصيانة
 */
const QRCodeIntegrationExample: React.FC = () => {
  const { t } = useTranslation();
  
  // بيانات نموذجية للحالة - في التطبيق الفعلي ستأتي من سياق الحالة أو API
  const sampleCase = {
    id: 12345,
    title: 'صيانة مكيف مركزي',
    clientName: 'شركة الأمل',
    clientPhone: '01012345678',
    deviceType: 'مكيف هواء',
    deviceModel: 'سامسونج AR5500',
    status: 'in_progress',
    issueDescription: 'الجهاز لا يبرد بشكل كافي',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    needsSync: false,
    // حقول إضافية لتحسين عرض رمز QR
    caseNumber: 'FZ-2025-0012',
    serialNumber: 'SN12345678',
    technicianName: 'محمد علي',
    technicianId: '101',
    priority: 'high',
    diagnosis: 'نقص في غاز التبريد',
    solution: 'إعادة شحن غاز التبريد وتنظيف المرشحات'
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{t('cases.qrCodeManagement')}</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">{t('qrCode.scanOrGenerate')}</h3>
        <p className="text-gray-600 mb-4">
          {t('qrCode.scanOrGenerateDescription')}
        </p>
        
        {/* عنصر إدارة رموز QR */}
        <CaseQRCodeManager caseData={sampleCase} />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">{t('qrCode.qrCodeForPrinting')}</h3>
        <p className="text-gray-600 mb-4">
          {t('qrCode.printingDescription')}
        </p>
        
        {/* عرض رمز QR مباشرة */}
        <CaseQRCodeManager caseData={sampleCase} inline={true} size={200} />
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <h3 className="text-md font-medium text-blue-700 mb-2">{t('common.tip')}</h3>
        <p className="text-sm text-blue-600">
          {t('qrCode.tipDescription')}
        </p>
      </div>
    </div>
  );
};

export default QRCodeIntegrationExample;

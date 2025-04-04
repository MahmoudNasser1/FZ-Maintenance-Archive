import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiCode, FiHash, FiX, FiList } from 'react-icons/fi';

import QRCodeGenerator from '../ui/QRCodeGenerator';
import QRCodeScanner from '../ui/QRCodeScanner';
import Modal from '../ui/Modal';
import { CaseItem, getCaseById } from '../../services/offlineStorage';
import { useOfflineSync } from '../../contexts/OfflineSyncContext';
import { QRScanNotification } from '../notifications/QRNotificationManager';

interface CaseQRCodeManagerProps {
  caseData?: CaseItem;
  size?: number;
  inline?: boolean;
  scannerOnly?: boolean;
  onCaseDataScanned?: (caseData: any) => void;
  onScanNotification?: (notification: QRScanNotification) => void;
  onShowBulkGenerator?: () => void;
}

const CaseQRCodeManager: React.FC<CaseQRCodeManagerProps> = ({
  caseData,
  size = 200,
  inline = false,
  scannerOnly = false,
  onCaseDataScanned,
  onScanNotification,
  onShowBulkGenerator,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isOnline } = useOfflineSync();
  
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [showQRGenerator, setShowQRGenerator] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // إنشاء بيانات QR Code للحالة
  const generateCaseQRData = (caseItemData: CaseItem) => {
    // تشفير بيانات الحالة الأساسية كـ JSON لتضمينها في رمز QR
    const qrData = {
      id: caseItemData.id,
      type: 'maintenance_case',
      title: caseItemData.title,
      caseNumber: caseItemData.caseNumber,
      deviceModel: caseItemData.deviceModel,
      status: caseItemData.status,
      serialNumber: caseItemData.serialNumber,
      // معلومات الفني المسؤول
      technicianName: caseItemData.technicianName,
      technicianId: caseItemData.technicianId,
      // معلومات العميل
      clientName: caseItemData.clientName,
      clientPhone: caseItemData.clientPhone,
      // الطوابع الزمنية
      createdAt: caseItemData.createdAt,
      updatedAt: caseItemData.updatedAt,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(qrData);
  };
  
  // معالجة نتيجة المسح
  const handleScan = async (data: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScanError(null);
    
    try {
      // محاولة تحليل البيانات كـ JSON
      const scannedData = JSON.parse(data);
      
      // إذا تم توفير دالة استدعاء خارجية للتعامل مع البيانات الممسوحة
      if (onCaseDataScanned) {
        onCaseDataScanned(scannedData);
        setShowScanner(false);
        setIsProcessing(false);
        return;
      }

      // التحقق مما إذا كانت البيانات تحتوي على معرف الحالة ونوعها
      if (scannedData.type === 'maintenance_case' && scannedData.id) {
        // إنشاء إشعار بمسح الرمز
        if (onScanNotification) {
          const newNotification: QRScanNotification = {
            id: `qr-scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            caseId: scannedData.id,
            caseName: scannedData.title || t('case.untitled'),
            timestamp: new Date(),
            read: false,
            offline: !isOnline
          };
          onScanNotification(newNotification);
        }
        
        // إذا كان التطبيق في وضع عدم الاتصال، تحقق من وجود الحالة في التخزين المحلي
        if (!isOnline) {
          try {
            const localCase = await getCaseById(Number(scannedData.id));
            if (!localCase) {
              setScanError(t('offline.caseNotAvailableOffline'));
              setIsProcessing(false);
              return;
            }
          } catch (err) {
            console.error('Error fetching local case:', err);
            setScanError(t('offline.errorFetchingLocalCase'));
            setIsProcessing(false);
            return;
          }
        }

        // إغلاق الماسح وتوجيه المستخدم إلى صفحة تفاصيل الحالة
        setShowScanner(false);
        navigate(`/cases/${scannedData.id}`);
      } else {
        setScanError(t('qrCode.invalidQrFormat'));
      }
    } catch (error) {
      console.error('Error parsing QR code data:', error);
      setScanError(t('qrCode.invalidQrData'));
    } finally {
      setIsProcessing(false);
    }
  };
  
  // معالجة أخطاء المسح
  const handleScanError = (error: Error) => {
    console.error('QR Code scan error:', error);
    setScanError(error.message);
  };
  
  // الحصول على رابط الحالة الحالية للمشاركة
  const getCurrentCaseUrl = () => {
    if (!caseData?.id) return window.location.href;
    
    // إنشاء رابط كامل للحالة
    const baseUrl = window.location.origin;
    return `${baseUrl}/cases/${caseData.id}`;
  };
  
  // عرض منبثق المسح
  const renderScannerModal = () => (
    <Modal isOpen={showScanner} onClose={() => setShowScanner(false)} size="md">
      <div className="p-0">
        <QRCodeScanner
          onScan={handleScan}
          onError={handleScanError}
          onClose={() => setShowScanner(false)}
        />
        
        {scanError && (
          <div className="p-4 text-center text-red-500">
            <p>{scanError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
  
  // عرض منبثق مولد رمز QR
  const renderQRGeneratorModal = () => {
    if (!caseData) return null;
    
    return (
      <Modal 
        isOpen={showQRGenerator} 
        onClose={() => setShowQRGenerator(false)}
        title={t('qrCode.shareCase')}
        size="md"
      >
        <div className="p-4">
          <QRCodeGenerator
            value={generateCaseQRData(caseData)}
            title={caseData.title}
            description={t('qrCode.scanToViewCaseDetails')}
            size={280}
            showControls={true}
          />
          
          <div className="mt-4 text-sm text-gray-500 text-center rtl:text-right">
            <p>{t('qrCode.qrCodeShareInfo')}</p>
          </div>
        </div>
      </Modal>
    );
  };
  
  // عرض مباشر لرمز QR في الصفحة
  if (inline && caseData) {
    return (
      <div className="my-4">
        <QRCodeGenerator
          value={generateCaseQRData(caseData)}
          title={caseData.title}
          size={size}
          showControls={true}
        />
      </div>
    );
  }
  
  // إذا كان الوضع هو الماسح فقط
  if (scannerOnly) {
    return (
      <div className="my-4">
        <QRCodeScanner
          onScan={handleScan}
          onError={handleScanError}
          onClose={() => {}}
        />
        {scanError && (
          <div className="p-4 text-center text-red-500">
            <p>{scanError}</p>
          </div>
        )}
      </div>
    );
  }

  // عرض أزرار التحكم
  return (
    <>
      <div className="flex space-x-2 rtl:space-x-reverse">
        {/* زر إنشاء رمز QR للحالة */}
        {caseData && (
          <button
            onClick={() => setShowQRGenerator(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            title={t('qrCode.generateQr')}
          >
            <FiCode className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('qrCode.generateQr')}
          </button>
        )}
        
        {/* زر مسح رمز QR */}
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          title={t('qrCode.scanQrCode')}
          disabled={isProcessing}
        >
          <FiHash className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t('qrCode.scanQr')}
        </button>
        
        {/* زر إنشاء مجموعة رموز QR */}
        {onShowBulkGenerator && (
          <button
            onClick={onShowBulkGenerator}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            title={t('qrCode.bulkGenerate')}
          >
            <FiList className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('qrCode.bulkGenerate')}
          </button>
        )}
        
        {/* حالة الاتصال */}
        {!isOnline && (
          <div className="px-3 py-2 text-xs font-medium text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 rounded-md flex items-center">
            {t('offline.workingOffline')}
          </div>
        )}
      </div>
      
      {/* العناصر المنبثقة */}
      {renderScannerModal()}
      {renderQRGeneratorModal()}
    </>
  );
};

export default CaseQRCodeManager;

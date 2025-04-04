import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QrReader } from 'react-qr-reader';
import { FiCamera, FiX, FiRefreshCw } from 'react-icons/fi';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScan,
  onError,
  onClose,
}) => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  
  // استرجاع قائمة الكاميرات المتاحة
  useEffect(() => {
    const getCameras = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          throw new Error(t('camera_not_supported'));
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setCameras(videoDevices);
        
        // استخدام الكاميرا الخلفية افتراضياً إذا كانت متوفرة
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        );
        
        if (backCamera && backCamera.deviceId) {
          setSelectedCamera(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    getCameras();
  }, [t, onError]);
  
  // تبديل الكاميرا
  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    
    const currentIndex = cameras.findIndex(camera => camera.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].deviceId);
  };
  
  // إعادة تشغيل الماسح
  const resetScanner = () => {
    setError(null);
    setScanning(true);
  };
  
  // معالجة المسح الناجح
  const handleScan = (result: { text: string } | null) => {
    if (result && result.text) {
      setScanning(false);
      onScan(result.text);
    }
  };
  
  // معالجة الأخطاء
  const handleError = (err: Error) => {
    console.error('QR Scanner error:', err);
    setError(err.message);
    if (onError) onError(err);
  };
  
  return (
    <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
      {/* شريط العنوان */}
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('scan_qr_code')}</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 focus:outline-none"
          aria-label={t('close')}
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
      
      {/* منطقة الماسح */}
      <div className="relative overflow-hidden" style={{ height: '350px' }}>
        {error ? (
          // عرض خطأ
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="text-red-500 mb-4 text-center">
              <p className="font-medium mb-2">{t('scanner_error')}</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={resetScanner}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
            >
              <FiRefreshCw className="inline-block mr-2" />
              {t('try_again')}
            </button>
          </div>
        ) : scanning && selectedCamera ? (
          // عرض الماسح
          <QrReader
            constraints={{
              facingMode: "environment",
              deviceId: selectedCamera
            }}
            onResult={handleScan}
            scanDelay={300}
            containerStyle={{ height: '100%', width: '100%' }}
            videoStyle={{ height: '100%', width: '100%', objectFit: 'cover' }}
            videoContainerStyle={{ height: '100%', width: '100%' }}
          />
        ) : (
          // عرض حالة التحميل إذا لم تكن الكاميرا جاهزة بعد
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p>{t('initializing_camera')}</p>
          </div>
        )}
        
        {/* مربع العرض للمسح */}
        {scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white rounded-lg opacity-70 shadow-lg"></div>
          </div>
        )}
      </div>
      
      {/* أزرار التحكم */}
      <div className="bg-gray-100 px-4 py-3 flex justify-between">
        {cameras.length > 1 && (
          <button
            onClick={toggleCamera}
            className="px-3 py-1 bg-gray-800 text-white rounded-md flex items-center space-x-1 rtl:space-x-reverse"
          >
            <FiCamera className="w-4 h-4" />
            <span>{t('switch_camera')}</span>
          </button>
        )}
        
        {!cameras.length > 1 && <div></div>}
        
        <div className="text-sm text-gray-600">
          {cameras.length > 0 && (
            <span>{t('active_camera')}: {cameras.find(c => c.deviceId === selectedCamera)?.label || t('default_camera')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;

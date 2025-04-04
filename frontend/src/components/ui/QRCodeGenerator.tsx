import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { FiShare2, FiDownload, FiPrinter } from 'react-icons/fi';

interface QRCodeGeneratorProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
  logo?: string;
  showControls?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  title,
  description,
  size = 200,
  logo,
  showControls = true,
}) => {
  const { t } = useTranslation();
  
  // تنفيذ وظيفة المشاركة
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || t('share_case'),
          text: description || t('scan_to_view_case'),
          url: value.startsWith('http') ? value : window.location.href,
        });
      } else {
        // نسخ الرابط إلى الحافظة إذا كانت المشاركة غير متوفرة
        await navigator.clipboard.writeText(
          value.startsWith('http') ? value : window.location.href
        );
        alert(t('copied_to_clipboard'));
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // تنفيذ وظيفة التنزيل
  const handleDownload = () => {
    try {
      // الحصول على البيانات كـ URL من عنصر SVG
      const svg = document.getElementById('qr-code-svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // إنشاء رابط تنزيل وتشغيله
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `${title || 'qr-code'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // تحرير الموارد
      URL.revokeObjectURL(svgUrl);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  // تنفيذ وظيفة الطباعة
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title || t('qr_code')}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
            }
            h2 {
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 20px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${title ? `<h2>${title}</h2>` : ''}
            ${description ? `<p>${description}</p>` : ''}
            ${svgData}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      {title && <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>}
      {description && <p className="mb-4 text-sm text-gray-500">{description}</p>}
      
      <div className="bg-white p-2 rounded-lg mb-4">
        <QRCodeSVG
          id="qr-code-svg"
          value={value}
          size={size}
          level="H" // أعلى مستوى من تصحيح الأخطاء
          includeMargin={true}
          imageSettings={logo ? {
            src: logo,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true,
          } : undefined}
        />
      </div>
      
      {showControls && (
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <FiShare2 className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('share')}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <FiDownload className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('download')}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <FiPrinter className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('print')}
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;

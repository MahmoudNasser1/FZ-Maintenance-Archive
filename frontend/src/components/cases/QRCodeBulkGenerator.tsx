import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowDownTrayIcon, DocumentDuplicateIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { CaseItem } from '../../services/offlineStorage';

interface QRCodeBulkGeneratorProps {
  cases: CaseItem[];
  maxPerPage?: number;
  onClose?: () => void;
}

const QRCodeBulkGenerator: React.FC<QRCodeBulkGeneratorProps> = ({
  cases,
  maxPerPage = 4,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [qrCodeRefs, setQrCodeRefs] = useState<React.RefObject<HTMLDivElement>[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // إنشاء مراجع للـ QR codes
    const refs = cases.map(() => React.createRef<HTMLDivElement>());
    setQrCodeRefs(refs);
  }, [cases]);

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
      technicianName: caseItemData.technicianName,
      clientName: caseItemData.clientName,
      createdAt: caseItemData.createdAt,
      updatedAt: caseItemData.updatedAt,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(qrData);
  };

  // تصدير جميع رموز QR كـ PDF
  const exportAllAsPDF = async () => {
    if (cases.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // استيراد مكتبة jsPDF بشكل ديناميكي
      const jsPDFModule = await import('jspdf');
      const pdf = new jsPDFModule.default('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // حساب حجم كل رمز QR
      const marginX = 20;
      const marginY = 20;
      const qrPerRow = 2;
      const qrWidth = (pageWidth - 2 * marginX) / qrPerRow;
      const qrHeight = qrWidth;
      const qrPerColumn = Math.floor((pageHeight - 2 * marginY) / (qrHeight + 20));
      const qrPerPage = qrPerRow * qrPerColumn;

      for (let i = 0; i < cases.length; i++) {
        const caseItem = cases[i];
        const pageIndex = Math.floor(i / qrPerPage);
        const positionOnPage = i % qrPerPage;
        const rowOnPage = Math.floor(positionOnPage / qrPerRow);
        const colOnPage = positionOnPage % qrPerRow;

        // إضافة صفحة جديدة إذا لزم الأمر
        if (positionOnPage === 0 && i > 0) {
          pdf.addPage();
        }

        // حساب موضع الرمز الحالي
        const x = marginX + (colOnPage * qrWidth);
        const y = marginY + (rowOnPage * (qrHeight + 20));

        // إنشاء رمز QR مؤقت لتحويله إلى صورة
        const qrCanvas = document.createElement('canvas');
        const qrValue = generateCaseQRData(caseItem);
        
        try {
          // استخدام مكتبة qrcode بشكل ديناميكي
          const QRCode = await import('qrcode');
          await QRCode.toCanvas(qrCanvas, qrValue, {
            width: 300,
            margin: 4,
            errorCorrectionLevel: 'H'
          });
          
          // تحويل Canvas إلى صورة وإضافتها إلى الـ PDF
          const qrImage = qrCanvas.toDataURL('image/png');
          pdf.addImage(qrImage, 'PNG', x, y, qrWidth * 0.8, qrWidth * 0.8);

          // إضافة معلومات الحالة تحت رمز QR
          pdf.setFontSize(8);
          pdf.text(`${t('case.caseNumber')}: ${caseItem.caseNumber || '-'}`, x, y + qrWidth * 0.85);
          pdf.text(`${t('case.title')}: ${caseItem.title}`, x, y + qrWidth * 0.85 + 4);
          pdf.text(`${t('case.client')}: ${caseItem.clientName}`, x, y + qrWidth * 0.85 + 8);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }

        // تحديث التقدم
        setGenerationProgress(Math.round(((i + 1) / cases.length) * 100));
      }

      // تصدير الـ PDF
      const FileSaver = await import('file-saver');
      const pdfBlob = pdf.output('blob');
      FileSaver.saveAs(pdfBlob, `${t('qrCode.qrCodesFor')} ${cases.length} ${t('qrCode.cases')}.pdf`);
      
      // عرض رسالة نجاح
      setSuccessMessage(t('qrCode.qrCodesExportedSuccessfully'));
      // إخفاء رسالة النجاح بعد 3 ثواني
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert(t('qrCode.errorExportingPdf'));
    } finally {
      setIsGenerating(false);
    }
  };

  // طباعة جميع رموز QR
  const printAllQRCodes = () => {
    if (cases.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    // تأخير قصير للسماح بتحديث واجهة المستخدم
    setTimeout(async () => {
      try {
        // إنشاء نافذة طباعة جديدة
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert(t('qrCode.errorOpeningPrintWindow'));
          setIsGenerating(false);
          return;
        }

        // بدء كتابة محتوى صفحة الطباعة
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
          <head>
            <title>${t('qrCode.qrCodesFor')} ${cases.length} ${t('qrCode.cases')}</title>
            <meta charset="utf-8" />
            <style>
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .page-break {
                  page-break-after: always;
                  break-after: page;
                }
              }
              body {
                font-family: Arial, sans-serif;
                direction: rtl;
              }
              .qr-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                padding: 20px;
              }
              .qr-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 20px;
                width: 200px;
              }
              .qr-info {
                margin-top: 10px;
                text-align: center;
                font-size: 12px;
              }
              .qr-title {
                font-weight: bold;
                margin-bottom: 5px;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
                padding: 10px;
                border-bottom: 1px solid #ddd;
              }
              .print-timestamp {
                text-align: center;
                font-size: 10px;
                color: #666;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>${t('qrCode.maintenanceCasesQrCodes')}</h1>
              <div class="print-timestamp">${new Date().toLocaleString()}</div>
            </div>
            <div class="qr-container">
        `);

        // إضافة كل رمز QR
        const QRCode = await import('qrcode');

        for (let i = 0; i < cases.length; i++) {
          const caseItem = cases[i];
          const qrValue = generateCaseQRData(caseItem);

          // إنشاء عنصر div لرمز QR الحالي
          printWindow.document.write(`
            <div class="qr-item">
              <div id="qr-${i}" class="qr-code"></div>
              <div class="qr-info">
                <div class="qr-title">${caseItem.title}</div>
                <div>${t('case.client')}: ${caseItem.clientName}</div>
                ${caseItem.caseNumber ? `<div>${t('case.caseNumber')}: ${caseItem.caseNumber}</div>` : ''}
                ${caseItem.serialNumber ? `<div>${t('case.serialNumber')}: ${caseItem.serialNumber}</div>` : ''}
              </div>
            </div>
            ${(i + 1) % 6 === 0 && i !== cases.length - 1 ? '<div class="page-break"></div>' : ''}
          `);

          // تحديث التقدم
          setGenerationProgress(Math.round(((i + 1) / cases.length) * 50));
        }

        // إغلاق عناصر HTML
        printWindow.document.write(`
            </div>
          </body>
          </html>
        `);

        printWindow.document.close();

        // انتظار تحميل الصفحة ثم إنشاء رموز QR
        printWindow.onload = async () => {
          try {
            for (let i = 0; i < cases.length; i++) {
              const qrContainer = printWindow.document.getElementById(`qr-${i}`);
              if (qrContainer) {
                const qrValue = generateCaseQRData(cases[i]);
                
                try {
                  const qrCanvas = document.createElement('canvas');
                  await QRCode.toCanvas(qrCanvas, qrValue, {
                    width: 200,
                    margin: 4,
                    errorCorrectionLevel: 'H'
                  });
                  qrContainer.appendChild(qrCanvas);
                } catch (error) {
                  console.error('Error generating QR in print window:', error);
                  const errorDiv = document.createElement('div');
                  errorDiv.textContent = t('qrCode.errorGeneratingQr');
                  errorDiv.style.color = 'red';
                  qrContainer.appendChild(errorDiv);
                }
              }
              
              // تحديث التقدم
              setGenerationProgress(50 + Math.round(((i + 1) / cases.length) * 50));
            }

            // عرض رسالة نجاح
            setSuccessMessage(t('qrCode.qrCodesPrintedSuccessfully'));
            // إخفاء رسالة النجاح بعد 3 ثواني
            setTimeout(() => setSuccessMessage(null), 3000);
            
            // طباعة النافذة
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
              setIsGenerating(false);
            }, 500);
          } catch (error) {
            console.error('Error in print window onload:', error);
            alert(t('qrCode.errorPrintingQrCodes'));
            setIsGenerating(false);
          }
        };
      } catch (error) {
        console.error('Error printing QR codes:', error);
        alert(t('qrCode.errorPrintingQrCodes'));
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{t('qrCode.bulkGeneration')}</h2>
      
      {cases.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('qrCode.noCasesSelected')}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {t('qrCode.selectedCasesCount', { count: cases.length })}
            </p>
          </div>
          
          {successMessage && (
            <div className="mb-4 p-2 bg-green-100 border border-green-300 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={exportAllAsPDF}
              disabled={isGenerating}
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-5 h-5 ml-2" />
              {t('qrCode.exportAsPdf')}
            </button>
            
            <button
              onClick={printAllQRCodes}
              disabled={isGenerating}
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <PrinterIcon className="w-5 h-5 ml-2" />
              {t('qrCode.printQrCodes')}
            </button>
            
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
          
          {isGenerating && (
            <div className="mb-6">
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600">
                {t('qrCode.generatingQrCodes')}: {generationProgress}%
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {cases.slice(0, 6).map((caseItem, index) => (
              <div key={`qr-preview-${index}`} className="border p-3 rounded-md">
                <div className="flex justify-center mb-2">
                  <QRCodeCanvas
                    value={generateCaseQRData(caseItem)}
                    size={100}
                    level="H"
                    includeMargin
                  />
                </div>
                <div className="text-xs">
                  <p className="font-medium truncate">{caseItem.title}</p>
                  <p className="text-gray-500 truncate">{caseItem.clientName}</p>
                  {caseItem.caseNumber && (
                    <p className="text-gray-500">{t('case.caseNumber')}: {caseItem.caseNumber}</p>
                  )}
                </div>
              </div>
            ))}
            {cases.length > 6 && (
              <div className="border p-3 rounded-md flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-sm">+{cases.length - 6} {t('common.more')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default QRCodeBulkGenerator;

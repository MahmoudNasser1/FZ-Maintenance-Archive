import React from 'react'
import {
  PhoneIcon,
  CalendarIcon,
  UserIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

// واجهة لبيانات الحالة
export interface CaseData {
  id: string
  deviceModel: string
  serialNumber: string
  clientName: string
  clientPhone: string
  issueDescription: string
  diagnosis?: string
  solution?: string
  status: string
  technicianName?: string
  createdAt: string
  updatedAt: string
}

interface CaseInfoProps {
  caseData: CaseData
  onStatusChange: (newStatus: string) => void
}

/**
 * مكون لعرض المعلومات الأساسية لحالة الصيانة
 */
const CaseInfo: React.FC<CaseInfoProps> = ({ caseData, onStatusChange }) => {
  // تحويل التاريخ إلى تنسيق مناسب للعرض
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('ar-EG', options)
  }

  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم الإصلاح':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'قيد الإصلاح':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'بانتظار القطعة':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ملغي':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // قائمة حالات الصيانة المتاحة للاختيار
  const availableStatuses = [
    'تم الاستلام',
    'قيد الفحص',
    'قيد الإصلاح',
    'بانتظار القطعة',
    'تم الإصلاح',
    'جاهز للتسليم',
    'تم التسليم',
    'ملغي'
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* رأس المعلومات */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">معلومات الحالة</h2>
        
        <div className="flex items-center">
          <QrCodeIcon className="h-6 w-6 text-gray-400 ml-2" />
          <span className="text-sm text-gray-500">رمز الحالة: {caseData.id.substring(0, 8)}</span>
        </div>
      </div>
      
      {/* تفاصيل الحالة */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* معلومات الجهاز */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">معلومات الجهاز</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">موديل الجهاز</p>
                  <p className="text-sm text-gray-500">{caseData.deviceModel}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">الرقم التسلسلي</p>
                  <p className="text-sm text-gray-500">{caseData.serialNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* معلومات العميل */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">معلومات العميل</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">اسم العميل</p>
                  <p className="text-sm text-gray-500">{caseData.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">رقم الهاتف</p>
                  <a 
                    href={`tel:${caseData.clientPhone}`} 
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    {caseData.clientPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* وصف المشكلة */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">وصف المشكلة</h3>
          <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md">{caseData.issueDescription}</p>
        </div>
        
        {/* التشخيص والحل */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">التشخيص</h3>
            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md min-h-[80px]">
              {caseData.diagnosis || 'لم يتم إضافة تشخيص بعد'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">الحل</h3>
            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-md min-h-[80px]">
              {caseData.solution || 'لم يتم إضافة حل بعد'}
            </p>
          </div>
        </div>

        {/* معلومات الحالة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">الحالة</h3>
            <select 
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${getStatusColor(caseData.status)}`}
              value={caseData.status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">تاريخ الاستلام</h3>
            <div className="flex items-center mt-1">
              <CalendarIcon className="h-5 w-5 text-gray-400 ml-2" />
              <span className="text-sm text-gray-700">{formatDate(caseData.createdAt)}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">آخر تحديث</h3>
            <div className="flex items-center mt-1">
              <CalendarIcon className="h-5 w-5 text-gray-400 ml-2" />
              <span className="text-sm text-gray-700">{formatDate(caseData.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaseInfo

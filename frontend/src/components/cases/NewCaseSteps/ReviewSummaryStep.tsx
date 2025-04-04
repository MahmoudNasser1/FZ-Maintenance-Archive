import React from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { ClientDeviceData } from './ClientDeviceStep'
import { ProblemDetailsData } from './ProblemDetailsStep'
import { DiagnosisRepairData } from './DiagnosisRepairStep'

// واجهة البيانات المجمعة
export interface NewCaseSummaryData {
  clientDevice: ClientDeviceData
  problemDetails: ProblemDetailsData
  diagnosisRepair: DiagnosisRepairData
  termsAccepted: boolean
}

interface ReviewSummaryStepProps {
  data: NewCaseSummaryData
  onSubmit: (values: NewCaseSummaryData) => void
  onEdit: (stepId: string) => void
}

/**
 * مكون خطوة المراجعة والتلخيص
 * الخطوة الأخيرة في نموذج إضافة حالة جديدة
 */
const ReviewSummaryStep: React.FC<ReviewSummaryStepProps> = ({ data, onSubmit, onEdit }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }
  
  // تنسيق التاريخ للعرض
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد'
    return new Date(dateString).toLocaleDateString('ar-EG')
  }
  
  // تحديد لون الأولوية
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  // ترجمة الأولوية
  const translatePriority = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفضة'
      case 'medium': return 'متوسطة'
      case 'high': return 'عالية'
      case 'urgent': return 'عاجلة'
      default: return priority
    }
  }
  
  // ترجمة حالة الجهاز
  const translateDeviceCondition = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'ممتاز (بدون خدوش أو أضرار)'
      case 'good': return 'جيد (خدوش طفيفة)'
      case 'fair': return 'مقبول (خدوش واضحة/أضرار خارجية)'
      case 'poor': return 'سيء (أضرار جسيمة)'
      case 'unknown': return 'غير محدد'
      default: return condition
    }
  }
  
  // ترجمة نوع الجهاز
  const translateDeviceType = (type: string) => {
    switch (type) {
      case 'smartphone': return 'هاتف ذكي'
      case 'tablet': return 'جهاز لوحي'
      case 'laptop': return 'حاسوب محمول'
      case 'desktop': return 'حاسوب مكتبي'
      case 'smartwatch': return 'ساعة ذكية'
      case 'other': return 'أخرى'
      default: return type
    }
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-6">مراجعة البيانات</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* معلومات العميل والجهاز */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-50 py-3 px-4 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900">معلومات العميل والجهاز</h3>
            <button
              type="button"
              onClick={() => onEdit('clientDevice')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              تعديل
            </button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">معلومات العميل</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">الاسم:</dt>
                    <dd className="text-sm font-medium text-gray-900">{data.clientDevice.clientName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">رقم الهاتف:</dt>
                    <dd className="text-sm font-medium text-gray-900 dir-ltr">{data.clientDevice.clientPhone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">البريد الإلكتروني:</dt>
                    <dd className="text-sm font-medium text-gray-900 dir-ltr">{data.clientDevice.clientEmail || 'غير محدد'}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">معلومات الجهاز</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">نوع الجهاز:</dt>
                    <dd className="text-sm font-medium text-gray-900">{translateDeviceType(data.clientDevice.deviceType)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">موديل الجهاز:</dt>
                    <dd className="text-sm font-medium text-gray-900">{data.clientDevice.deviceModel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">الرقم التسلسلي:</dt>
                    <dd className="text-sm font-medium text-gray-900 dir-ltr">{data.clientDevice.serialNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">تاريخ الشراء:</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatDate(data.clientDevice.purchaseDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">تحت الضمان:</dt>
                    <dd className="text-sm font-medium text-gray-900">{data.clientDevice.underWarranty ? 'نعم' : 'لا'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* تفاصيل المشكلة */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-50 py-3 px-4 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900">تفاصيل المشكلة</h3>
            <button
              type="button"
              onClick={() => onEdit('problemDetails')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              تعديل
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">وصف المشكلة:</h4>
                <p className="text-sm text-gray-900 whitespace-pre-line">{data.problemDetails.issueDescription}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">تاريخ بدء المشكلة:</h4>
                <p className="text-sm text-gray-900">{formatDate(data.problemDetails.issueStartDate)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">الأعراض التي ذكرها العميل:</h4>
                {data.problemDetails.clientReportedSymptoms.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.problemDetails.clientReportedSymptoms.map((symptom, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-primary-500 ml-1 flex-shrink-0" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">لم يتم تحديد أعراض</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">حالة الجهاز:</h4>
                <p className="text-sm text-gray-900">{translateDeviceCondition(data.problemDetails.deviceCondition)}</p>
              </div>
              
              {data.problemDetails.additionalNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">ملاحظات إضافية:</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-line">{data.problemDetails.additionalNotes}</p>
                </div>
              )}
              
              {data.problemDetails.voiceNote && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">ملاحظة صوتية:</h4>
                  <p className="text-sm text-primary-600">تم تسجيل ملاحظة صوتية</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* التشخيص والإصلاح */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-50 py-3 px-4 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900">التشخيص والإصلاح</h3>
            <button
              type="button"
              onClick={() => onEdit('diagnosisRepair')}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              تعديل
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">التشخيص المبدئي:</h4>
                <p className="text-sm text-gray-900 whitespace-pre-line">{data.diagnosisRepair.initialDiagnosis}</p>
              </div>
              
              {data.diagnosisRepair.repairActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">إجراءات الإصلاح:</h4>
                  <ol className="list-decimal mr-5 space-y-1">
                    {data.diagnosisRepair.repairActions.map((action, index) => (
                      <li key={index} className="text-sm text-gray-900">{action}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {data.diagnosisRepair.requiredParts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">القطع المطلوبة:</h4>
                  <div className="overflow-hidden rounded-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500">القطعة</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500">رقم القطعة</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500">الكمية</th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500">متوفرة</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.diagnosisRepair.requiredParts.map((part, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.partName}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{part.partNumber || 'غير محدد'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.quantity}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{part.inStock ? 'نعم' : 'لا'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">التكلفة التقديرية:</h4>
                  <p className="text-sm font-bold text-gray-900">{data.diagnosisRepair.estimatedCost} جنيه</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">الوقت التقديري للإنجاز:</h4>
                  <p className="text-sm text-gray-900">{data.diagnosisRepair.estimatedCompletionTime || 'غير محدد'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">الأولوية:</h4>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(data.diagnosisRepair.priority)}`}>
                    {translatePriority(data.diagnosisRepair.priority)}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">الفني المسؤول:</h4>
                <p className="text-sm text-gray-900">{
                  // في التطبيق الفعلي، سيتم استبدال هذه القيمة بالاسم المرتبط بالمعرف
                  data.diagnosisRepair.assignedTechnician === 'tech1' ? 'محمد علي' :
                  data.diagnosisRepair.assignedTechnician === 'tech2' ? 'أحمد خالد' :
                  data.diagnosisRepair.assignedTechnician === 'tech3' ? 'سارة أحمد' :
                  data.diagnosisRepair.assignedTechnician === 'tech4' ? 'عمر سعيد' :
                  data.diagnosisRepair.assignedTechnician
                }</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* الموافقة على الشروط */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="termsAccepted"
              name="termsAccepted"
              type="checkbox"
              checked={data.termsAccepted}
              onChange={(e) => onSubmit({ ...data, termsAccepted: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          <div className="mr-3 text-sm">
            <label htmlFor="termsAccepted" className="font-medium text-gray-700">
              أقر بأن المعلومات المدخلة دقيقة وصحيحة
            </label>
            <p className="text-gray-500">
              أفهم أن تقديم معلومات غير دقيقة قد يؤثر على تشخيص المشكلة وإصلاح الجهاز.
            </p>
          </div>
        </div>
        
        {/* زر تقديم النموذج */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!data.termsAccepted}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              data.termsAccepted
                ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <CheckCircleIcon className="ml-2 h-5 w-5" />
            إضافة الحالة
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReviewSummaryStep

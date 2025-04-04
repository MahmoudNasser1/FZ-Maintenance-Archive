import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUturnLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// استيراد مكون النموذج متعدد الخطوات
import MultiStepForm, { Step } from '../../components/common/MultiStepForm'

// استيراد مكونات الخطوات
import ClientDeviceStep, { ClientDeviceData } from '../../components/cases/NewCaseSteps/ClientDeviceStep'
import ProblemDetailsStep, { ProblemDetailsData } from '../../components/cases/NewCaseSteps/ProblemDetailsStep'
import DiagnosisRepairStep, { DiagnosisRepairData } from '../../components/cases/NewCaseSteps/DiagnosisRepairStep'
import ReviewSummaryStep, { NewCaseSummaryData } from '../../components/cases/NewCaseSteps/ReviewSummaryStep'

/**
 * صفحة إنشاء حالة صيانة جديدة
 */
const NewCase: React.FC = () => {
  const navigate = useNavigate()
  
  // القيم الأولية لكل خطوة
  const initialClientDeviceData: ClientDeviceData = {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    deviceType: '',
    deviceModel: '',
    serialNumber: '',
    purchaseDate: '',
    underWarranty: false
  }
  
  const initialProblemDetailsData: ProblemDetailsData = {
    issueDescription: '',
    issueStartDate: '',
    clientReportedSymptoms: [],
    deviceCondition: '',
    additionalNotes: '',
    voiceNote: ''
  }
  
  const initialDiagnosisRepairData: DiagnosisRepairData = {
    initialDiagnosis: '',
    repairActions: [],
    requiredParts: [],
    estimatedCost: 0,
    estimatedCompletionTime: '',
    assignedTechnician: '',
    priority: 'medium'
  }
  
  // حالة البيانات لكل خطوة
  const [clientDeviceData, setClientDeviceData] = useState<ClientDeviceData>(initialClientDeviceData)
  const [problemDetailsData, setProblemDetailsData] = useState<ProblemDetailsData>(initialProblemDetailsData)
  const [diagnosisRepairData, setDiagnosisRepairData] = useState<DiagnosisRepairData>(initialDiagnosisRepairData)
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  // حالة نجاح إنشاء الحالة
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // إنشاء كائن جديد يحتوي على الخطوة الأولى
  const [activeStepId, setActiveStepId] = useState<string>('clientDevice')
  
  // معالجة تقديم خطوة معلومات العميل والجهاز
  const handleClientDeviceSubmit = (data: ClientDeviceData) => {
    setClientDeviceData(data)
    setActiveStepId('problemDetails')
  }
  
  // معالجة تقديم خطوة تفاصيل المشكلة
  const handleProblemDetailsSubmit = (data: ProblemDetailsData) => {
    setProblemDetailsData(data)
    setActiveStepId('diagnosisRepair')
  }
  
  // معالجة تقديم خطوة التشخيص والإصلاح
  const handleDiagnosisRepairSubmit = (data: DiagnosisRepairData) => {
    setDiagnosisRepairData(data)
    setActiveStepId('reviewSummary')
  }
  
  // معالجة تقديم خطوة المراجعة والتلخيص
  const handleReviewSubmit = (data: NewCaseSummaryData) => {
    setTermsAccepted(data.termsAccepted)
    
    // إذا تم قبول الشروط، أرسل النموذج
    if (data.termsAccepted) {
      handleSubmitCase()
    }
  }
  
  // معالجة تقديم النموذج بالكامل
  const handleSubmitCase = async () => {
    setIsSubmitting(true)
    
    try {
      // في التطبيق الفعلي، هنا سيتم إرسال البيانات إلى الخادم
      console.log('Submitting new case:', {
        clientDeviceData,
        problemDetailsData,
        diagnosisRepairData,
        termsAccepted
      })
      
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // تعيين حالة النجاح
      setIsSuccess(true)
      
      // إعادة توجيه المستخدم إلى صفحة تفاصيل الحالة بعد فترة
      setTimeout(() => {
        navigate('/cases')
      }, 3000)
    } catch (error) {
      console.error('Error submitting case:', error)
      // هنا يمكن إضافة منطق معالجة الخطأ
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // معالجة النقر على زر العودة
  const handleGoBack = () => {
    navigate('/cases')
  }
  
  // تكوين خطوات النموذج
  const formSteps: Step[] = [
    {
      id: 'clientDevice',
      title: 'معلومات العميل والجهاز',
      content: <ClientDeviceStep initialData={clientDeviceData} onSubmit={handleClientDeviceSubmit} />
    },
    {
      id: 'problemDetails',
      title: 'تفاصيل المشكلة',
      content: <ProblemDetailsStep initialData={problemDetailsData} onSubmit={handleProblemDetailsSubmit} />
    },
    {
      id: 'diagnosisRepair',
      title: 'التشخيص والإصلاح',
      content: <DiagnosisRepairStep initialData={diagnosisRepairData} onSubmit={handleDiagnosisRepairSubmit} />
    },
    {
      id: 'reviewSummary',
      title: 'المراجعة والتأكيد',
      content: (
        <ReviewSummaryStep
          data={{
            clientDevice: clientDeviceData,
            problemDetails: problemDetailsData,
            diagnosisRepair: diagnosisRepairData,
            termsAccepted
          }}
          onSubmit={handleReviewSubmit}
          onEdit={setActiveStepId}
        />
      )
    }
  ]
  
  // البحث عن الخطوة النشطة ضمن خطوات النموذج
  const activeStepIndex = formSteps.findIndex(step => step.id === activeStepId)
  
  // إذا تم إنشاء الحالة بنجاح
  if (isSuccess) {
    return (
      <div className="py-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-full bg-green-100 h-20 w-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إنشاء الحالة بنجاح!</h2>
          <p className="text-gray-500 mb-6">
            تمت إضافة حالة الصيانة الجديدة بنجاح. سيتم توجيهك إلى قائمة الحالات تلقائيًا.
          </p>
          <button
            onClick={() => navigate('/cases')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            العودة إلى قائمة الحالات
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="py-10">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <button
              onClick={handleGoBack}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">إضافة حالة صيانة جديدة</h1>
          </div>
          <p className="text-sm text-gray-500">قم بإدخال معلومات الحالة الجديدة من خلال النموذج أدناه.</p>
        </div>
      </div>
      
      {/* حالة التحميل */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">جاري إنشاء الحالة...</h3>
              <p className="text-sm text-gray-500">يرجى الانتظار بينما نقوم بمعالجة طلبك.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* النموذج متعدد الخطوات */}
      <div className="max-w-4xl mx-auto">
        <MultiStepForm
          steps={formSteps}
          onComplete={handleSubmitCase}
          allowSkipToStep={false}
          initialStepIndex={activeStepIndex}
        />
      </div>
    </div>
  )
}

export default NewCase

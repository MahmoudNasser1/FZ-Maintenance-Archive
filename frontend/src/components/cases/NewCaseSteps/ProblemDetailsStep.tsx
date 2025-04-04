import React, { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { MicrophoneIcon, PauseIcon, XMarkIcon } from '@heroicons/react/24/outline'

// واجهة بيانات المشكلة
export interface ProblemDetailsData {
  issueDescription: string
  issueStartDate?: string
  clientReportedSymptoms: string[]
  deviceCondition: string
  additionalNotes?: string
  voiceNote?: string // URL للملاحظة الصوتية إن وجدت
}

interface ProblemDetailsStepProps {
  initialData: ProblemDetailsData
  onSubmit: (values: ProblemDetailsData) => void
}

// مخطط التحقق
const validationSchema = Yup.object({
  issueDescription: Yup.string().required('وصف المشكلة مطلوب'),
  issueStartDate: Yup.date().nullable(),
  clientReportedSymptoms: Yup.array().of(Yup.string()),
  deviceCondition: Yup.string().required('حالة الجهاز مطلوبة'),
  additionalNotes: Yup.string(),
  voiceNote: Yup.string()
})

/**
 * مكون خطوة إدخال تفاصيل المشكلة
 * الخطوة الثانية في نموذج إضافة حالة جديدة
 */
const ProblemDetailsStep: React.FC<ProblemDetailsStepProps> = ({ initialData, onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  
  // قائمة حالات الجهاز
  const deviceConditions = [
    { value: 'excellent', label: 'ممتاز (بدون خدوش أو أضرار)' },
    { value: 'good', label: 'جيد (خدوش طفيفة)' },
    { value: 'fair', label: 'مقبول (خدوش واضحة/أضرار خارجية)' },
    { value: 'poor', label: 'سيء (أضرار جسيمة)' },
    { value: 'unknown', label: 'غير محدد' }
  ]
  
  // قائمة أعراض المشكلة الشائعة حسب نوع الجهاز
  const commonSymptoms = [
    'لا يتم التشغيل',
    'يعمل ببطء',
    'الشاشة لا تستجيب',
    'الشاشة مكسورة',
    'مشاكل في الصوت',
    'لا يشحن',
    'البطارية تنفد بسرعة',
    'يتوقف فجأة',
    'بقع على الشاشة',
    'إعادة تشغيل متكررة',
    'مشاكل في الاتصال بالشبكة',
    'مشاكل في الكاميرا',
    'أزرار لا تعمل',
    'ارتفاع في درجة الحرارة',
    'مشاكل في البرامج/التطبيقات'
  ]
  
  // بدء التسجيل الصوتي (محاكاة)
  const startRecording = () => {
    // محاكاة لوظيفة التسجيل الصوتي (في التطبيق الفعلي ستستخدم واجهة برمجة تطبيقات الوسائط)
    setIsRecording(true)
    setRecordingDuration(0)
    
    // بدء عداد التسجيل
    const timer = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
    
    setRecordingTimer(timer)
  }
  
  // إيقاف التسجيل الصوتي
  const stopRecording = (setFieldValue: (field: string, value: any) => void) => {
    // إيقاف العداد
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    
    setIsRecording(false)
    
    // محاكاة لحفظ الملاحظة الصوتية (في التطبيق الفعلي ستقوم برفع الملف وتخزينه)
    if (recordingDuration > 0) {
      // تعيين عنوان URL وهمي للملاحظة الصوتية
      setFieldValue('voiceNote', `voice-note-${Date.now()}.mp3`)
    }
  }
  
  // إلغاء التسجيل الصوتي
  const cancelRecording = () => {
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    
    setIsRecording(false)
    setRecordingDuration(0)
  }
  
  // تنسيق وقت التسجيل (تحويل الثواني إلى تنسيق دقائق:ثواني)
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-6">تفاصيل المشكلة</h2>
      
      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            {/* وصف المشكلة */}
            <div>
              <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-1">
                وصف المشكلة <span className="text-red-500">*</span>
              </label>
              <Field
                as="textarea"
                id="issueDescription"
                name="issueDescription"
                rows={4}
                className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                  errors.issueDescription && touched.issueDescription
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              <ErrorMessage name="issueDescription" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            
            {/* تاريخ بدء المشكلة */}
            <div>
              <label htmlFor="issueStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                متى بدأت المشكلة؟
              </label>
              <Field
                type="date"
                id="issueStartDate"
                name="issueStartDate"
                className="block w-full rounded-md py-2 px-3 shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
              <ErrorMessage name="issueStartDate" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            
            {/* الأعراض التي ذكرها العميل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأعراض التي ذكرها العميل
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {commonSymptoms.map(symptom => (
                  <div key={symptom} className="flex items-center">
                    <Field
                      type="checkbox"
                      id={`symptom-${symptom}`}
                      name="clientReportedSymptoms"
                      value={symptom}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`symptom-${symptom}`} className="mr-2 block text-sm text-gray-700">
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* حالة الجهاز */}
            <div>
              <label htmlFor="deviceCondition" className="block text-sm font-medium text-gray-700 mb-1">
                حالة الجهاز <span className="text-red-500">*</span>
              </label>
              <Field
                as="select"
                id="deviceCondition"
                name="deviceCondition"
                className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                  errors.deviceCondition && touched.deviceCondition
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
              >
                <option value="">-- اختر حالة الجهاز --</option>
                {deviceConditions.map(condition => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </Field>
              <ErrorMessage name="deviceCondition" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            
            {/* ملاحظات إضافية */}
            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات إضافية
              </label>
              <Field
                as="textarea"
                id="additionalNotes"
                name="additionalNotes"
                rows={3}
                className="block w-full rounded-md py-2 px-3 shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
              <ErrorMessage name="additionalNotes" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            
            {/* تسجيل ملاحظة صوتية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تسجيل ملاحظة صوتية
              </label>
              
              {!values.voiceNote && !isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <MicrophoneIcon className="ml-2 h-5 w-5 text-gray-500" />
                  بدء التسجيل
                </button>
              ) : isRecording ? (
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="flex items-center py-2 px-3 border border-red-300 rounded-md bg-red-50 text-red-700">
                    <span className="inline-block h-3 w-3 rounded-full bg-red-600 animate-pulse mr-2"></span>
                    <span>{formatRecordingTime(recordingDuration)}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => stopRecording(setFieldValue)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PauseIcon className="ml-2 h-5 w-5 text-gray-500" />
                    إنهاء التسجيل
                  </button>
                  
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              ) : values.voiceNote ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex items-center">
                    <MicrophoneIcon className="h-5 w-5 text-gray-500 ml-2" />
                    <span className="text-sm text-gray-700">تم تسجيل ملاحظة صوتية</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFieldValue('voiceNote', '')}
                    className="p-1 text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </div>
            
            {/* زر الحفظ والمتابعة (سيتم التعامل معه من خلال المكون الأب) */}
            <div className="hidden">
              <button type="submit" disabled={isSubmitting}>
                المتابعة
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default ProblemDetailsStep

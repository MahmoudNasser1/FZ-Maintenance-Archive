import React, { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { PlusIcon, TrashIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

// واجهة بيانات التشخيص والإصلاح
export interface DiagnosisRepairData {
  initialDiagnosis: string
  repairActions: string[]
  requiredParts: {
    partName: string
    partNumber?: string
    quantity: number
    inStock: boolean
  }[]
  estimatedCost: number
  estimatedCompletionTime: string // مثال: "2 ساعات" أو "3 أيام"
  assignedTechnician: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface DiagnosisRepairStepProps {
  initialData: DiagnosisRepairData
  onSubmit: (values: DiagnosisRepairData) => void
}

// مخطط التحقق
const validationSchema = Yup.object({
  initialDiagnosis: Yup.string().required('التشخيص المبدئي مطلوب'),
  repairActions: Yup.array().of(Yup.string()),
  requiredParts: Yup.array().of(
    Yup.object().shape({
      partName: Yup.string().required('اسم القطعة مطلوب'),
      partNumber: Yup.string(),
      quantity: Yup.number().required('الكمية مطلوبة').min(1, 'الكمية يجب أن تكون 1 على الأقل'),
      inStock: Yup.boolean()
    })
  ),
  estimatedCost: Yup.number().min(0, 'التكلفة لا يمكن أن تكون سالبة'),
  estimatedCompletionTime: Yup.string(),
  assignedTechnician: Yup.string().required('الفني المسؤول مطلوب'),
  priority: Yup.string().oneOf(['low', 'medium', 'high', 'urgent'], 'أولوية غير صالحة').required('الأولوية مطلوبة')
})

/**
 * مكون خطوة التشخيص والإصلاح
 * الخطوة الثالثة في نموذج إضافة حالة جديدة
 */
const DiagnosisRepairStep: React.FC<DiagnosisRepairStepProps> = ({ initialData, onSubmit }) => {
  const [tipVisible, setTipVisible] = useState(false)
  
  // قائمة الفنيين (في التطبيق الفعلي، سيتم جلبها من API)
  const technicians = [
    { id: 'tech1', name: 'محمد علي' },
    { id: 'tech2', name: 'أحمد خالد' },
    { id: 'tech3', name: 'سارة أحمد' },
    { id: 'tech4', name: 'عمر سعيد' }
  ]
  
  // خيارات الأولوية
  const priorityOptions = [
    { value: 'low', label: 'منخفضة', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'medium', label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'high', label: 'عالية', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'urgent', label: 'عاجلة', color: 'bg-red-100 text-red-800 border-red-200' }
  ]
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-6">التشخيص والإصلاح</h2>
      
      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            {/* التشخيص المبدئي */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="initialDiagnosis" className="block text-sm font-medium text-gray-700">
                  التشخيص المبدئي <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTipVisible(!tipVisible)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </div>
              
              {tipVisible && (
                <div className="p-3 mb-3 bg-blue-50 rounded-md border border-blue-200 text-sm text-blue-700">
                  <p>نصائح للتشخيص الفعال:</p>
                  <ul className="list-disc mr-5 mt-1 text-xs">
                    <li>حدد المشكلة بدقة</li>
                    <li>اذكر الأعراض وعلاقتها المحتملة بالسبب</li>
                    <li>اذكر الاختبارات التي قمت بها للتشخيص</li>
                  </ul>
                </div>
              )}
              
              <Field
                as="textarea"
                id="initialDiagnosis"
                name="initialDiagnosis"
                rows={4}
                className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                  errors.initialDiagnosis && touched.initialDiagnosis
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
              />
              <ErrorMessage name="initialDiagnosis" component="p" className="mt-1 text-sm text-red-600" />
            </div>
            
            {/* إجراءات الإصلاح */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إجراءات الإصلاح
              </label>
              
              <div className="space-y-2">
                {values.repairActions.map((action, index) => (
                  <div key={index} className="flex gap-2">
                    <Field
                      type="text"
                      name={`repairActions[${index}]`}
                      className="block w-full rounded-md py-2 px-3 shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                      placeholder={`إجراء الإصلاح ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedActions = [...values.repairActions]
                        updatedActions.splice(index, 1)
                        setFieldValue('repairActions', updatedActions)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue('repairActions', [...values.repairActions, ''])
                  }}
                  className="inline-flex items-center mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 ml-1" />
                  إضافة إجراء
                </button>
              </div>
            </div>
            
            {/* القطع المطلوبة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القطع المطلوبة
              </label>
              
              <div className="space-y-3">
                {values.requiredParts.map((part, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor={`requiredParts[${index}].partName`} className="block text-xs font-medium text-gray-700 mb-1">
                          اسم القطعة <span className="text-red-500">*</span>
                        </label>
                        <Field
                          type="text"
                          name={`requiredParts[${index}].partName`}
                          className="block w-full rounded-md py-1.5 px-2 text-sm shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        />
                        <ErrorMessage name={`requiredParts[${index}].partName`} component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                      
                      <div>
                        <label htmlFor={`requiredParts[${index}].partNumber`} className="block text-xs font-medium text-gray-700 mb-1">
                          رقم القطعة
                        </label>
                        <Field
                          type="text"
                          name={`requiredParts[${index}].partNumber`}
                          className="block w-full rounded-md py-1.5 px-2 text-sm shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`requiredParts[${index}].quantity`} className="block text-xs font-medium text-gray-700 mb-1">
                          الكمية <span className="text-red-500">*</span>
                        </label>
                        <Field
                          type="number"
                          name={`requiredParts[${index}].quantity`}
                          min="1"
                          className="block w-full rounded-md py-1.5 px-2 text-sm shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                        />
                        <ErrorMessage name={`requiredParts[${index}].quantity`} component="p" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id={`requiredParts[${index}].inStock`}
                          name={`requiredParts[${index}].inStock`}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`requiredParts[${index}].inStock`} className="mr-2 block text-sm text-gray-700">
                          متوفرة في المخزن
                        </label>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const updatedParts = [...values.requiredParts]
                          updatedParts.splice(index, 1)
                          setFieldValue('requiredParts', updatedParts)
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        إزالة
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue('requiredParts', [
                      ...values.requiredParts,
                      { partName: '', partNumber: '', quantity: 1, inStock: false }
                    ])
                  }}
                  className="inline-flex items-center mt-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 ml-1" />
                  إضافة قطعة
                </button>
              </div>
            </div>
            
            {/* التكلفة والوقت والأولوية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* التكلفة التقديرية */}
              <div>
                <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                  التكلفة التقديرية
                </label>
                <div className="relative rounded-md shadow-sm">
                  <Field
                    type="number"
                    id="estimatedCost"
                    name="estimatedCost"
                    min="0"
                    className="block w-full rounded-md py-2 px-3 pr-12 shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">جنيه</span>
                  </div>
                </div>
                <ErrorMessage name="estimatedCost" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              
              {/* الوقت التقديري للإنجاز */}
              <div>
                <label htmlFor="estimatedCompletionTime" className="block text-sm font-medium text-gray-700 mb-1">
                  الوقت التقديري للإنجاز
                </label>
                <Field
                  type="text"
                  id="estimatedCompletionTime"
                  name="estimatedCompletionTime"
                  placeholder="مثال: 2 ساعات، 3 أيام"
                  className="block w-full rounded-md py-2 px-3 shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
                <ErrorMessage name="estimatedCompletionTime" component="p" className="mt-1 text-sm text-red-600" />
              </div>
              
              {/* الأولوية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الأولوية <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  {priorityOptions.map(option => (
                    <label
                      key={option.value}
                      className={`flex-1 relative px-2 py-2 rounded-md border text-center text-sm cursor-pointer transition-colors
                        ${values.priority === option.value
                          ? option.color
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                    >
                      <Field
                        type="radio"
                        name="priority"
                        value={option.value}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <ErrorMessage name="priority" component="p" className="mt-1 text-sm text-red-600" />
              </div>
            </div>
            
            {/* الفني المسؤول */}
            <div>
              <label htmlFor="assignedTechnician" className="block text-sm font-medium text-gray-700 mb-1">
                الفني المسؤول <span className="text-red-500">*</span>
              </label>
              <Field
                as="select"
                id="assignedTechnician"
                name="assignedTechnician"
                className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                  errors.assignedTechnician && touched.assignedTechnician
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
              >
                <option value="">-- اختر الفني المسؤول --</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </Field>
              <ErrorMessage name="assignedTechnician" component="p" className="mt-1 text-sm text-red-600" />
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

export default DiagnosisRepairStep

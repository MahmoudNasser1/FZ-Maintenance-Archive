import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

// واجهة بيانات العميل والجهاز
export interface ClientDeviceData {
  clientName: string
  clientPhone: string
  clientEmail?: string
  deviceType: string
  deviceModel: string
  serialNumber: string
  purchaseDate?: string
  underWarranty: boolean
}

interface ClientDeviceStepProps {
  initialData: ClientDeviceData
  onSubmit: (values: ClientDeviceData) => void
}

// مخطط التحقق
const validationSchema = Yup.object({
  clientName: Yup.string().required('اسم العميل مطلوب'),
  clientPhone: Yup.string().required('رقم الهاتف مطلوب'),
  clientEmail: Yup.string().email('البريد الإلكتروني غير صالح'),
  deviceType: Yup.string().required('نوع الجهاز مطلوب'),
  deviceModel: Yup.string().required('موديل الجهاز مطلوب'),
  serialNumber: Yup.string().required('الرقم التسلسلي مطلوب'),
  purchaseDate: Yup.date().nullable(),
  underWarranty: Yup.boolean()
})

/**
 * مكون خطوة إدخال معلومات العميل والجهاز
 * الخطوة الأولى في نموذج إضافة حالة جديدة
 */
const ClientDeviceStep: React.FC<ClientDeviceStepProps> = ({ initialData, onSubmit }) => {
  // قائمة أنواع الأجهزة
  const deviceTypes = [
    { value: 'smartphone', label: 'هاتف ذكي' },
    { value: 'tablet', label: 'جهاز لوحي' },
    { value: 'laptop', label: 'حاسوب محمول' },
    { value: 'desktop', label: 'حاسوب مكتبي' },
    { value: 'smartwatch', label: 'ساعة ذكية' },
    { value: 'other', label: 'أخرى' }
  ]
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-6">معلومات العميل والجهاز</h2>
      
      <Formik
        initialValues={initialData}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form className="space-y-6">
            {/* قسم معلومات العميل */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-4">معلومات العميل</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                    اسم العميل <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="clientName"
                    name="clientName"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.clientName && touched.clientName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="clientName" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                
                <div>
                  <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="clientPhone"
                    name="clientPhone"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.clientPhone && touched.clientPhone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="clientPhone" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                
                <div>
                  <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <Field
                    type="email"
                    id="clientEmail"
                    name="clientEmail"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.clientEmail && touched.clientEmail
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="clientEmail" component="p" className="mt-1 text-sm text-red-600" />
                </div>
              </div>
            </div>
            
            {/* قسم معلومات الجهاز */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-4">معلومات الجهاز</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700 mb-1">
                    نوع الجهاز <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    id="deviceType"
                    name="deviceType"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.deviceType && touched.deviceType
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  >
                    <option value="">-- اختر نوع الجهاز --</option>
                    {deviceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="deviceType" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                
                <div>
                  <label htmlFor="deviceModel" className="block text-sm font-medium text-gray-700 mb-1">
                    موديل الجهاز <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="deviceModel"
                    name="deviceModel"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.deviceModel && touched.deviceModel
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="deviceModel" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                
                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    الرقم التسلسلي <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.serialNumber && touched.serialNumber
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="serialNumber" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                
                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الشراء
                  </label>
                  <Field
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    className={`block w-full rounded-md py-2 px-3 shadow-sm ${
                      errors.purchaseDate && touched.purchaseDate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  <ErrorMessage name="purchaseDate" component="p" className="mt-1 text-sm text-red-600" />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    id="underWarranty"
                    name="underWarranty"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="underWarranty" className="mr-2 block text-sm text-gray-700">
                    الجهاز تحت الضمان
                  </label>
                </div>
              </div>
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

export default ClientDeviceStep

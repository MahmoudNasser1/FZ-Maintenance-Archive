import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

// مخطط التحقق من صحة نموذج تسجيل الدخول
const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('اسم المستخدم مطلوب')
    .min(3, 'اسم المستخدم قصير جدًا'),
  password: Yup.string()
    .required('كلمة المرور مطلوبة')
    .min(6, 'كلمة المرور قصيرة جدًا'),
  rememberMe: Yup.boolean()
})

// نموذج بيانات تسجيل الدخول
interface LoginFormValues {
  username: string
  password: string
  rememberMe: boolean
}

const Login = () => {
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string | null>(null)

  // محاكاة عملية تسجيل الدخول (في الإنتاج ستكون طلب API حقيقي)
  const handleLogin = async (values: LoginFormValues) => {
    try {
      // إعادة تعيين أي أخطاء سابقة
      setLoginError(null)
      
      // محاكاة تأخير الشبكة
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // في الإنتاج، ستقوم بإرسال طلب API للتحقق من بيانات الاعتماد
      // ثم تخزين رمز الوصول (token) في التخزين المحلي
      
      // محاكاة نجاح تسجيل الدخول
      if (values.username === 'admin' && values.password === 'password') {
        localStorage.setItem('accessToken', 'sample-token-value')
        navigate('/dashboard')
      } else {
        // محاكاة فشل تسجيل الدخول
        setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch (error) {
      setLoginError('حدث خطأ أثناء محاولة تسجيل الدخول')
      console.error('Login error:', error)
    }
  }

  const initialValues: LoginFormValues = {
    username: '',
    password: '',
    rememberMe: false
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h2 className="text-2xl font-bold text-center text-secondary-900 mb-6">
        تسجيل الدخول
      </h2>
      
      <Formik
        initialValues={initialValues}
        validationSchema={LoginSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            {/* عرض رسالة الخطأ إذا فشل تسجيل الدخول */}
            {loginError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
                {loginError}
              </div>
            )}
            
            {/* حقل اسم المستخدم */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-1">
                اسم المستخدم
              </label>
              <Field
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="appearance-none block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="أدخل اسم المستخدم"
              />
              <ErrorMessage name="username" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            {/* حقل كلمة المرور */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-1">
                كلمة المرور
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm placeholder-secondary-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="أدخل كلمة المرور"
              />
              <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
            </div>

            {/* خيار تذكرني */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Field
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="rememberMe" className="mr-2 block text-sm text-secondary-700">
                  تذكرني
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  نسيت كلمة المرور؟
                </a>
              </div>
            </div>

            {/* زر تسجيل الدخول */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default Login

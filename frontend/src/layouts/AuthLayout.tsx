import { Outlet } from 'react-router-dom'

/**
 * تخطيط صفحات المصادقة
 * يستخدم للصفحات غير المصادقة مثل تسجيل الدخول ونسيت كلمة المرور
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex flex-col items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-xl">
        <div className="flex justify-center mb-8">
          <img src="/logo.svg" alt="Fix Zone" className="h-16" />
        </div>
        <Outlet />
      </div>
      <div className="mt-6 text-white text-sm">
        Fix Zone Maintenance Archive &copy; {new Date().getFullYear()}
      </div>
    </div>
  )
}

export default AuthLayout

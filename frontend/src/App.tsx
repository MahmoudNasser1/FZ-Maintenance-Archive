import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import LoadingScreen from './components/common/LoadingScreen'

// استيراد الصفحات بشكل كسول لتحسين الأداء
const LoginPage = lazy(() => import('./pages/auth/Login'))
const DashboardPage = lazy(() => import('./pages/dashboard/Dashboard'))
const CasesListPage = lazy(() => import('./pages/cases/CasesList'))
const CaseDetailsPage = lazy(() => import('./pages/cases/CaseDetails'))
const NewCasePage = lazy(() => import('./pages/cases/NewCase'))
const ProfilePage = lazy(() => import('./pages/profile/Profile'))
const ResourcesPage = lazy(() => import('./pages/resources/Resources'))
const ReportsPage = lazy(() => import('./pages/reports/Reports'))
const NotFoundPage = lazy(() => import('./pages/NotFound'))

// دالة مساعدة للتحقق من وجود توكن صالح
const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken')
  return !!token // تحقق بسيط من وجود التوكن، يمكن تحسينه للتحقق من صلاحية التوكن
}

// مكون للحماية المسارات التي تتطلب تسجيل دخول
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* مسارات المصادقة */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* المسارات المحمية التي تتطلب تسجيل دخول */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cases" element={<CasesListPage />} />
          <Route path="/cases/new" element={<NewCasePage />} />
          <Route path="/cases/:id" element={<CaseDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        {/* صفحة غير موجود للمسارات غير المعروفة */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App

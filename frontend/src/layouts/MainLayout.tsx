import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import Header from '../components/navigation/Header'

/**
 * تخطيط الصفحات الرئيسية
 * يستخدم لجميع الصفحات بعد تسجيل الدخول ويحتوي على الشريط الجانبي والشريط العلوي
 */
const MainLayout = () => {
  // حالة لتتبع حالة الشريط الجانبي (مفتوح/مغلق)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // التبديل بين فتح وإغلاق الشريط الجانبي
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      {/* شريط التنقل العلوي */}
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* الشريط الجانبي */}
        <Sidebar isOpen={sidebarOpen} />
        
        {/* المحتوى الرئيسي */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 p-6 ${sidebarOpen ? 'md:mr-64' : 'md:mr-20'}`}>
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout

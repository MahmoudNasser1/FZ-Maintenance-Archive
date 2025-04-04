import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CaseStatistics from '../components/dashboard/CaseStatistics'
import RecentActivities, { ActivityItem } from '../components/dashboard/RecentActivities'
import { PlusIcon } from '@heroicons/react/24/outline'

/**
 * صفحة لوحة التحكم
 * تعرض نظرة عامة على حالات الصيانة والإحصائيات والأنشطة الحديثة
 */
const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCases: 0,
    pendingCases: 0,
    completedCases: 0,
    avgResolutionTime: '',
    newCasesPercentChange: 0,
    completionRatePercentChange: 0,
    pendingCasesPercentChange: 0
  })
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // محاكاة جلب البيانات من API
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // بيانات إحصائية ثابتة للعرض التوضيحي
        setStats({
          totalCases: 127,
          pendingCases: 42,
          completedCases: 85,
          avgResolutionTime: '3.5 يوم',
          newCasesPercentChange: 12,
          completionRatePercentChange: 8,
          pendingCasesPercentChange: -5
        })
        
        // أنشطة ثابتة للعرض التوضيحي
        setRecentActivities([
          {
            id: '1',
            caseId: '1',
            caseNumber: 'FZ-2025-001',
            actionType: 'status_change',
            description: 'تم تغيير حالة الطلب إلى "قيد الإصلاح"',
            performedBy: {
              id: '101',
              name: 'محمد علي'
            },
            timestamp: new Date(Date.now() - 30 * 60000).toISOString() // منذ 30 دقيقة
          },
          {
            id: '2',
            caseId: '2',
            caseNumber: 'FZ-2025-002',
            actionType: 'note',
            description: 'تمت إضافة ملاحظة جديدة: "تم طلب قطعة الغيار المطلوبة"',
            performedBy: {
              id: '102',
              name: 'أحمد محمود'
            },
            timestamp: new Date(Date.now() - 2 * 3600000).toISOString() // منذ ساعتين
          },
          {
            id: '3',
            caseId: '3',
            caseNumber: 'FZ-2025-003',
            actionType: 'case_completed',
            description: 'تم إكمال الحالة بنجاح وإخطار العميل',
            performedBy: {
              id: '101',
              name: 'محمد علي'
            },
            timestamp: new Date(Date.now() - 4 * 3600000).toISOString() // منذ 4 ساعات
          },
          {
            id: '4',
            caseId: '5',
            caseNumber: 'FZ-2025-005',
            actionType: 'attachment',
            description: 'تم إضافة مرفق جديد: "تقرير الفحص.pdf"',
            performedBy: {
              id: '103',
              name: 'علي عبد الرحمن'
            },
            timestamp: new Date(Date.now() - 5 * 3600000).toISOString() // منذ 5 ساعات
          },
          {
            id: '5',
            caseId: '6',
            caseNumber: 'FZ-2025-006',
            actionType: 'case_created',
            description: 'تم إنشاء حالة صيانة جديدة',
            performedBy: {
              id: '102',
              name: 'أحمد محمود'
            },
            timestamp: new Date(Date.now() - 8 * 3600000).toISOString() // منذ 8 ساعات
          },
          {
            id: '6',
            caseId: '7',
            caseNumber: 'FZ-2025-007',
            actionType: 'work_log',
            description: 'بدأت جلسة عمل جديدة على هذه الحالة',
            performedBy: {
              id: '101',
              name: 'محمد علي'
            },
            timestamp: new Date(Date.now() - 24 * 3600000).toISOString() // منذ يوم
          }
        ])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // يمكن إضافة إدارة الأخطاء هنا
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  // قائمة الإجراءات السريعة
  const quickActions = [
    { name: 'إضافة حالة جديدة', href: '/cases/new', icon: PlusIcon },
    { name: 'البحث في الحالات', href: '/cases', icon: null },
    { name: 'إدارة المستخدمين', href: '/users', icon: null },
    { name: 'الإعدادات', href: '/settings', icon: null }
  ]

  return (
    <div className="py-10">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-gray-500">مرحباً بك في نظام إدارة حالات الصيانة</p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {action.icon && <action.icon className="ml-2 -mr-1 h-5 w-5 text-gray-500" />}
              {action.name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* إحصائيات الحالات */}
      <div className="mb-8">
        <CaseStatistics stats={stats} />
      </div>
      
      {/* قسم الأنشطة والتقارير */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* الأنشطة الحديثة */}
        <div className="lg:col-span-2">
          <RecentActivities
            activities={recentActivities}
            isLoading={isLoading}
            title="آخر الأنشطة"
            viewAllLink="/activities"
            maxItems={5}
          />
        </div>
        
        {/* العناصر المفضلة والروابط السريعة */}
        <div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الروابط السريعة</h3>
            <div className="space-y-3">
              <Link
                to="/cases"
                className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-800"
              >
                عرض جميع الحالات
              </Link>
              <Link
                to="/cases?filter=pending"
                className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-800"
              >
                الحالات قيد المعالجة
              </Link>
              <Link
                to="/reports"
                className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-800"
              >
                التقارير والإحصائيات
              </Link>
              <Link
                to="/settings/profile"
                className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-800"
              >
                إعدادات الملف الشخصي
              </Link>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">الفنيون النشطون</h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <span className="block font-medium text-gray-900">محمد علي</span>
                  <span className="block text-sm text-gray-500">5 حالات</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <span className="block font-medium text-gray-900">أحمد محمود</span>
                  <span className="block text-sm text-gray-500">3 حالات</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <span className="block font-medium text-gray-900">علي عبد الرحمن</span>
                  <span className="block text-sm text-gray-500">2 حالات</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* إحصائيات إضافية أو رسوم بيانية يمكن إضافتها هنا */}
    </div>
  )
}

export default Dashboard

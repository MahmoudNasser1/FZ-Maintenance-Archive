import React from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

// واجهة النشاط
export interface Activity {
  id: string
  action: string
  performedBy: {
    id: string
    name: string
    avatarUrl?: string
  }
  createdAt: string
}

interface ActivityLogTabProps {
  activities: Activity[]
}

/**
 * مكون علامة تبويب سجل الأنشطة
 * يعرض تاريخ الإجراءات المتخذة على الحالة
 */
const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ activities }) => {
  // تحويل التاريخ إلى تنسيق مناسب للعرض
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('ar-EG', options)
  }
  
  // تحديد لون النشاط بناءً على نوعه
  const getActivityColor = (action: string) => {
    if (action.includes('تم استلام') || action.includes('تسجيل')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    } else if (action.includes('تم فحص') || action.includes('فحص')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else if (action.includes('تم إصلاح') || action.includes('إصلاح')) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else if (action.includes('طلب قطعة') || action.includes('انتظار')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    } else if (action.includes('تم تسليم') || action.includes('تسليم')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    } else if (action.includes('ملغي') || action.includes('إلغاء')) {
      return 'bg-red-100 text-red-800 border-red-200'
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  // تحديد أيقونة النشاط (يمكن إضافة المزيد من الأيقونات حسب الحاجة)
  const getActivityIcon = (action: string) => {
    // في هذا المثال نستخدم أيقونة الساعة لكل الأنشطة، ويمكن تخصيص أيقونات مختلفة لكل نوع
    return <ClockIcon className="h-5 w-5" />
  }
  
  return (
    <div>
      {activities.length > 0 ? (
        <div className="relative">
          {/* خط الزمن الرأسي */}
          <div className="absolute top-0 bottom-0 right-7 w-0.5 bg-gray-200"></div>
          
          {/* قائمة الأنشطة */}
          <ul className="space-y-6">
            {activities.map((activity) => {
              const colorClass = getActivityColor(activity.action)
              const ActivityIcon = getActivityIcon(activity.action)
              
              return (
                <li key={activity.id} className="relative">
                  {/* نقطة في خط الزمن */}
                  <div className={`absolute right-5 top-1 w-5 h-5 rounded-full border-2 border-white ${colorClass} z-10 flex items-center justify-center`}>
                    {ActivityIcon}
                  </div>
                  
                  {/* بطاقة النشاط */}
                  <div className="mr-16 p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{activity.performedBy.name}</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{activity.action}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد أنشطة</h3>
          <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي نشاط على هذه الحالة بعد.</p>
        </div>
      )}
    </div>
  )
}

export default ActivityLogTab

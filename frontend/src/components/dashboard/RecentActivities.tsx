import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export interface ActivityItem {
  id: string
  caseId: string
  caseNumber: string
  actionType: 'status_change' | 'note' | 'attachment' | 'work_log' | 'case_created' | 'case_completed'
  description: string
  performedBy: {
    id: string
    name: string
  }
  timestamp: string
}

interface RecentActivitiesProps {
  activities: ActivityItem[]
  isLoading?: boolean
  title?: string
  viewAllLink?: string
  maxItems?: number
}

/**
 * مكون الأنشطة الحديثة
 * يعرض قائمة بآخر الأنشطة والتحديثات على حالات الصيانة
 */
const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  isLoading = false,
  title = 'آخر الأنشطة',
  viewAllLink,
  maxItems = 5
}) => {
  // اختيار الأيقونة المناسبة لنوع النشاط
  const getActivityIcon = (activityType: ActivityItem['actionType']) => {
    switch (activityType) {
      case 'status_change':
        return <ClockIcon className="h-5 w-5 text-blue-500" />
      case 'note':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-amber-500" />
      case 'attachment':
        return <PaperClipIcon className="h-5 w-5 text-gray-500" />
      case 'work_log':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-purple-500" />
      case 'case_created':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />
      case 'case_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
    }
  }

  // تنسيق التاريخ ليكون أكثر قابلية للقراءة
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000)
    
    // أقل من دقيقة
    if (diffInSeconds < 60) {
      return 'منذ لحظات'
    }
    
    // أقل من ساعة
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
    }
    
    // أقل من يوم
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
    }
    
    // أقل من أسبوع
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
    }
    
    // تنسيق التاريخ العادي
    return activityTime.toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // محتوى المكون في حالة التحميل
  const renderLoadingState = () => (
    <div className="space-y-4 pb-2">
      {[...Array(maxItems)].map((_, index) => (
        <div key={`loading-${index}`} className="flex animate-pulse opacity-60">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200"></div>
          <div className="mr-4 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )

  // محتوى المكون في حالة عدم وجود أنشطة
  const renderEmptyState = () => (
    <div className="text-center py-6">
      <p className="text-gray-500">لا توجد أنشطة حديثة</p>
    </div>
  )

  // محتوى المكون الأساسي
  const renderActivities = () => {
    const displayedActivities = activities.slice(0, maxItems)
    
    return (
      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200">
          {displayedActivities.map((activity) => (
            <li key={activity.id} className="py-4">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/cases/${activity.caseId}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                    {activity.caseNumber}
                  </Link>
                  <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <UserIcon className="flex-shrink-0 ml-1 h-4 w-4" />
                    <span>{activity.performedBy.name}</span>
                    <span className="mx-2">•</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            عرض الكل
          </Link>
        )}
      </div>
      
      {isLoading 
        ? renderLoadingState() 
        : activities.length > 0 
          ? renderActivities() 
          : renderEmptyState()
      }
    </div>
  )
}

export default RecentActivities

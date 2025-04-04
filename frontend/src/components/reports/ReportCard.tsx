import React, { ReactNode } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface ReportCardProps {
  title: string
  description?: string
  children: ReactNode
  isLoading?: boolean
  onRefresh?: () => void
  onExport?: () => void
  className?: string
}

/**
 * مكون بطاقة التقارير
 * إطار قياسي لعرض التقارير والرسومات البيانية
 */
const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  children,
  isLoading = false,
  onRefresh,
  onExport,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* رأس البطاقة */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="تحديث البيانات"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              disabled={isLoading}
              className={`p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="تصدير البيانات"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* محتوى البطاقة */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default ReportCard

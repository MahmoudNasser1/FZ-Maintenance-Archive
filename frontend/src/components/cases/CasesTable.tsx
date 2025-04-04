import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ChevronRightIcon, 
  ChevronLeftIcon,
  ChevronUpDownIcon,
  ArrowDownIcon, 
  ArrowUpIcon 
} from '@heroicons/react/24/outline'

// واجهة الحالة
export interface Case {
  id: string
  caseNumber: string
  clientName: string
  deviceModel: string
  status: string
  createdAt: string
  updatedAt: string
  technicianName: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface CasesTableProps {
  cases: Case[]
  isLoading: boolean
  onSort: (field: keyof Case) => void
  sortField?: keyof Case
  sortDirection?: 'asc' | 'desc'
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/**
 * مكون جدول الحالات
 * يعرض قائمة الحالات بتنسيق جدولي مع إمكانية الترتيب والتنقل بين الصفحات
 */
const CasesTable: React.FC<CasesTableProps> = ({
  cases,
  isLoading,
  onSort,
  sortField,
  sortDirection,
  page,
  totalPages,
  onPageChange
}) => {
  const navigate = useNavigate()
  
  // تكوين الأعمدة
  const columns: { key: keyof Case, label: string, sortable: boolean, className?: string }[] = [
    { key: 'caseNumber', label: 'رقم الحالة', sortable: true },
    { key: 'clientName', label: 'العميل', sortable: true },
    { key: 'deviceModel', label: 'الموديل', sortable: true },
    { key: 'status', label: 'الحالة', sortable: true },
    { key: 'createdAt', label: 'تاريخ الإنشاء', sortable: true },
    { key: 'technicianName', label: 'الفني المسؤول', sortable: true, className: 'hidden md:table-cell' },
    { key: 'priority', label: 'الأولوية', sortable: true, className: 'hidden lg:table-cell' },
    { key: 'updatedAt', label: 'آخر تحديث', sortable: true, className: 'hidden lg:table-cell' }
  ]
  
  // الانتقال إلى صفحة تفاصيل الحالة
  const handleRowClick = (caseId: string) => {
    navigate(`/cases/${caseId}`)
  }
  
  // تنسيق التاريخ للعرض
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
  
  // الحصول على لون وتسمية حالة الحالة
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'جديدة':
        return 'bg-blue-100 text-blue-800'
      case 'قيد الفحص':
        return 'bg-purple-100 text-purple-800'
      case 'قيد الإصلاح':
        return 'bg-yellow-100 text-yellow-800'
      case 'بانتظار القطعة':
        return 'bg-orange-100 text-orange-800'
      case 'تم الإصلاح':
        return 'bg-green-100 text-green-800'
      case 'تم التسليم':
        return 'bg-indigo-100 text-indigo-800'
      case 'ملغاة':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  // الحصول على لون وتسمية أولوية الحالة
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'low':
        return { color: 'bg-blue-100 text-blue-800', label: 'منخفضة' }
      case 'medium':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'متوسطة' }
      case 'high':
        return { color: 'bg-orange-100 text-orange-800', label: 'عالية' }
      case 'urgent':
        return { color: 'bg-red-100 text-red-800', label: 'عاجلة' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: priority }
    }
  }
  
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* جدول الحالات */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => onSort(column.key)}
                      className="group inline-flex items-center"
                      disabled={isLoading}
                    >
                      {column.label}
                      <span className="mr-1 flex-none rounded">
                        {sortField === column.key ? (
                          sortDirection === 'desc' ? (
                            <ArrowDownIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ArrowUpIcon className="h-4 w-4 text-gray-500" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                        )}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              // صفوف التحميل
              Array(5).fill(0).map((_, index) => (
                <tr key={`loading-${index}`}>
                  {columns.map((column) => (
                    <td
                      key={`loading-cell-${column.key}-${index}`}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${column.className || ''}`}
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : cases.length > 0 ? (
              // صفوف البيانات
              cases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  onClick={() => handleRowClick(caseItem.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caseItem.caseNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caseItem.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caseItem.deviceModel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dir-ltr">
                    {formatDate(caseItem.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                    {caseItem.technicianName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityStyle(caseItem.priority).color}`}>
                      {getPriorityStyle(caseItem.priority).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell dir-ltr">
                    {formatDate(caseItem.updatedAt)}
                  </td>
                </tr>
              ))
            ) : (
              // لا توجد بيانات
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                  لا توجد حالات متطابقة مع معايير البحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* شريط التنقل بين الصفحات */}
      {totalPages > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isLoading}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === 1 || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              السابق
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isLoading}
              className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === totalPages || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              التالي
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                عرض <span className="font-medium">{cases.length}</span> حالة
                {totalPages > 0 && (
                  <>
                    {' '}صفحة <span className="font-medium">{page}</span> من أصل <span className="font-medium">{totalPages}</span>
                  </>
                )}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px rtl:space-x-reverse" aria-label="Pagination">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    page === 1 || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">السابق</span>
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {/* أرقام الصفحات */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    // إذا كان عدد الصفحات 5 أو أقل، عرض جميع الأرقام
                    pageNum = i + 1
                  } else if (page <= 3) {
                    // إذا كانت الصفحة الحالية قريبة من البداية
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    // إذا كانت الصفحة الحالية قريبة من النهاية
                    pageNum = totalPages - 4 + i
                  } else {
                    // إذا كانت الصفحة في المنتصف
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page === totalPages || isLoading}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    page === totalPages || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">التالي</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CasesTable

import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  TagIcon
} from '@heroicons/react/24/outline'

export interface FilterOptions {
  searchQuery: string
  status: string[]
  dateRange: {
    startDate: string
    endDate: string
  }
  technicians: string[]
  clientName: string
}

interface CasesFilterBarProps {
  onFilterChange: (filters: FilterOptions) => void
  initialFilters?: FilterOptions
  isLoading?: boolean
}

/**
 * مكون شريط التصفية والبحث لقائمة الحالات
 */
const CasesFilterBar: React.FC<CasesFilterBarProps> = ({
  onFilterChange,
  initialFilters,
  isLoading = false
}) => {
  // الحالات (يتم جلبها من API في التطبيق الفعلي)
  const statusOptions = [
    { id: 'new', label: 'جديدة', color: 'bg-blue-100 text-blue-800' },
    { id: 'in-progress', label: 'قيد المعالجة', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'waiting-parts', label: 'بانتظار القطع', color: 'bg-purple-100 text-purple-800' },
    { id: 'fixed', label: 'تم الإصلاح', color: 'bg-green-100 text-green-800' },
    { id: 'delivered', label: 'تم التسليم', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'cancelled', label: 'ملغاة', color: 'bg-red-100 text-red-800' }
  ]
  
  // الفنيون (يتم جلبهم من API في التطبيق الفعلي)
  const technicians = [
    { id: 'tech1', name: 'محمد علي' },
    { id: 'tech2', name: 'أحمد خالد' },
    { id: 'tech3', name: 'سارة أحمد' },
    { id: 'tech4', name: 'عمر سعيد' }
  ]
  
  // القيم الافتراضية للتصفية
  const defaultFilters: FilterOptions = {
    searchQuery: '',
    status: [],
    dateRange: {
      startDate: '',
      endDate: ''
    },
    technicians: [],
    clientName: ''
  }
  
  // حالة التصفية الحالية
  const [filters, setFilters] = useState<FilterOptions>(initialFilters || defaultFilters)
  
  // حالة عرض/إخفاء مربع التصفية المتقدمة
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  
  // حساب عدد التصفيات النشطة
  const getActiveFilterCount = (): number => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++
    if (filters.technicians.length > 0) count++
    if (filters.clientName) count++
    return count
  }
  
  // تحديث التصفيات وإرسالها للمكون الأب
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }
  
  // معالجة تغيير قيمة البحث
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ searchQuery: e.target.value })
  }
  
  // معالجة تغيير حالة الحالة
  const handleStatusChange = (statusId: string) => {
    const updatedStatus = filters.status.includes(statusId)
      ? filters.status.filter(id => id !== statusId)
      : [...filters.status, statusId]
    
    updateFilters({ status: updatedStatus })
  }
  
  // معالجة تغيير نطاق التاريخ
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    updateFilters({
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    })
  }
  
  // معالجة تغيير الفنيين
  const handleTechnicianChange = (techId: string) => {
    const updatedTechnicians = filters.technicians.includes(techId)
      ? filters.technicians.filter(id => id !== techId)
      : [...filters.technicians, techId]
    
    updateFilters({ technicians: updatedTechnicians })
  }
  
  // معالجة تغيير اسم العميل
  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ clientName: e.target.value })
  }
  
  // إعادة تعيين جميع التصفيات
  const resetAllFilters = () => {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      {/* شريط البحث الرئيسي */}
      <div className="flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            disabled={isLoading}
            className="block w-full rounded-md border-gray-300 pr-10 focus:border-primary-500 focus:ring-primary-500 text-sm"
            placeholder="بحث عن رقم الحالة، اسم العميل، الموديل..."
            value={filters.searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`mr-2 p-2 rounded-md ${
            isFilterPanelOpen || getActiveFilterCount() > 0
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span className="sr-only">فتح خيارات التصفية</span>
          <div className="relative">
            <FunnelIcon className="h-5 w-5" />
            {getActiveFilterCount() > 0 && (
              <span className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-4 w-4 rounded-full bg-primary-600 text-white text-xs">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
        </button>
        
        {getActiveFilterCount() > 0 && (
          <button
            type="button"
            onClick={resetAllFilters}
            disabled={isLoading}
            className="mr-2 text-sm text-gray-500 hover:text-gray-700"
          >
            مسح الكل
          </button>
        )}
      </div>
      
      {/* مربع التصفية المتقدمة */}
      {isFilterPanelOpen && (
        <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700">تصفية متقدمة</h3>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* تصفية حسب الحالة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الحالة
              </label>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <div key={status.id} className="flex items-center">
                    <input
                      id={`status-${status.id}`}
                      name={`status-${status.id}`}
                      type="checkbox"
                      checked={filters.status.includes(status.id)}
                      onChange={() => handleStatusChange(status.id)}
                      disabled={isLoading}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`status-${status.id}`} className="mr-2 flex items-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${status.color.split(' ')[0]}`}></span>
                      <span className="text-sm text-gray-700 mr-1">{status.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* تصفية حسب التاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نطاق التاريخ
              </label>
              <div className="space-y-2">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    disabled={isLoading}
                    className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* تصفية حسب الفني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الفني المسؤول
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {technicians.map((tech) => (
                  <div key={tech.id} className="flex items-center">
                    <input
                      id={`tech-${tech.id}`}
                      name={`tech-${tech.id}`}
                      type="checkbox"
                      checked={filters.technicians.includes(tech.id)}
                      onChange={() => handleTechnicianChange(tech.id)}
                      disabled={isLoading}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`tech-${tech.id}`} className="mr-2 text-sm text-gray-700">
                      {tech.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* تصفية حسب اسم العميل */}
            <div>
              <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
                اسم العميل
              </label>
              <input
                type="text"
                id="client-name"
                value={filters.clientName}
                onChange={handleClientNameChange}
                disabled={isLoading}
                className="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
                placeholder="أدخل اسم العميل"
              />
            </div>
          </div>
          
          {/* أزرار التطبيق وإعادة التعيين */}
          <div className="flex justify-end mt-4 space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={resetAllFilters}
              disabled={isLoading || getActiveFilterCount() === 0}
              className={`inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                getActiveFilterCount() === 0
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      )}
      
      {/* الشارات النشطة للتصفية */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.status.map((statusId) => {
            const statusOption = statusOptions.find(s => s.id === statusId)
            if (!statusOption) return null
            
            return (
              <span
                key={statusId}
                className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${statusOption.color}`}
              >
                <TagIcon className="h-3 w-3 ml-1" />
                {statusOption.label}
                <button
                  type="button"
                  onClick={() => handleStatusChange(statusId)}
                  disabled={isLoading}
                  className="mr-1 focus:outline-none"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          
          {filters.dateRange.startDate && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
              من: {filters.dateRange.startDate}
              <button
                type="button"
                onClick={() => handleDateChange('startDate', '')}
                disabled={isLoading}
                className="mr-1 focus:outline-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.dateRange.endDate && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
              إلى: {filters.dateRange.endDate}
              <button
                type="button"
                onClick={() => handleDateChange('endDate', '')}
                disabled={isLoading}
                className="mr-1 focus:outline-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          
          {filters.technicians.map((techId) => {
            const technician = technicians.find(t => t.id === techId)
            if (!technician) return null
            
            return (
              <span
                key={techId}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800"
              >
                الفني: {technician.name}
                <button
                  type="button"
                  onClick={() => handleTechnicianChange(techId)}
                  disabled={isLoading}
                  className="mr-1 focus:outline-none"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          
          {filters.clientName && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
              العميل: {filters.clientName}
              <button
                type="button"
                onClick={() => updateFilters({ clientName: '' })}
                disabled={isLoading}
                className="mr-1 focus:outline-none"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default CasesFilterBar

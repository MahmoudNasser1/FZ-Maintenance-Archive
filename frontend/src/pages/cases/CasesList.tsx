import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  PlusIcon
} from '@heroicons/react/24/outline'
import CasesTable, { Case } from '../../components/cases/CasesTable'
import CasesFilterBar from '../../components/cases/CasesFilterBar'

// الصفحة الرئيسية لعرض قائمة حالات الصيانة
const CasesList = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<keyof Case>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [activeFilters, setActiveFilters] = useState<{
    status?: string
    technician?: string
    startDate?: string
    endDate?: string
    clientName?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // بيانات توضيحية للحالات (في التطبيق الفعلي ستأتي من API)
  const casesData: Case[] = [
    {
      id: '1',
      caseNumber: 'FZ-2025-001',
      deviceModel: 'iPhone 12',
      clientName: 'عمر أحمد',
      status: 'جديدة',
      technicianName: 'محمد علي',
      createdAt: '2025-04-02T10:30:00',
      updatedAt: '2025-04-02T10:30:00',
      priority: 'medium'
    },
    {
      id: '2',
      caseNumber: 'FZ-2025-002',
      deviceModel: 'Samsung Galaxy S21',
      clientName: 'سارة محمد',
      status: 'بانتظار القطعة',
      technicianName: 'محمد علي',
      createdAt: '2025-04-01T14:45:00',
      updatedAt: '2025-04-02T09:30:00',
      priority: 'high'
    },
    {
      id: '3',
      caseNumber: 'FZ-2025-003',
      deviceModel: 'MacBook Pro',
      clientName: 'خالد إبراهيم',
      status: 'تم الإصلاح',
      technicianName: 'أحمد محمود',
      createdAt: '2025-03-31T09:15:00',
      updatedAt: '2025-04-01T14:20:00',
      priority: 'medium'
    },
    {
      id: '4',
      caseNumber: 'FZ-2025-004',
      deviceModel: 'Lenovo ThinkPad',
      clientName: 'نورا سمير',
      status: 'تم الإصلاح',
      technicianName: 'محمد علي',
      createdAt: '2025-03-30T16:20:00',
      updatedAt: '2025-03-31T11:45:00',
      priority: 'low'
    },
    {
      id: '5',
      caseNumber: 'FZ-2025-005',
      deviceModel: 'Xiaomi Redmi Note 10',
      clientName: 'محمود عبد الرحمن',
      status: 'قيد الفحص',
      technicianName: 'أحمد محمود',
      createdAt: '2025-03-30T11:10:00',
      updatedAt: '2025-03-30T13:25:00',
      priority: 'medium'
    },
    {
      id: '6',
      caseNumber: 'FZ-2025-006',
      deviceModel: 'iPad Air',
      clientName: 'فاطمة محمد',
      status: 'قيد الإصلاح',
      technicianName: 'علي عبد الرحمن',
      createdAt: '2025-03-29T13:30:00',
      updatedAt: '2025-03-30T09:15:00',
      priority: 'high'
    },
    {
      id: '7',
      caseNumber: 'FZ-2025-007',
      deviceModel: 'HP Pavilion',
      clientName: 'أحمد فؤاد',
      status: 'تم التسليم',
      technicianName: 'علي عبد الرحمن',
      createdAt: '2025-03-28T10:45:00',
      updatedAt: '2025-03-29T15:30:00',
      priority: 'medium'
    }
  ]
  
  // تطبيق البحث والتصفية على البيانات
  const filteredCases = casesData.filter(caseItem => {
    // تطبيق البحث
    const matchesSearch = searchTerm === '' || 
      caseItem.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // تطبيق الفلترة حسب الحالة
    const matchesStatus = !activeFilters.status || caseItem.status === activeFilters.status
    
    // تطبيق الفلترة حسب الفني
    const matchesTechnician = !activeFilters.technician || caseItem.technicianName === activeFilters.technician
    
    // تطبيق الفلترة حسب اسم العميل
    const matchesClient = !activeFilters.clientName || 
      caseItem.clientName.toLowerCase().includes(activeFilters.clientName.toLowerCase())
    
    // يمكن إضافة المزيد من شروط الفلترة هنا (مثل النطاق الزمني)
    
    return matchesSearch && matchesStatus && matchesTechnician && matchesClient
  })
  
  // فرز البيانات
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (!sortField) return 0
    
    const valueA = a[sortField]
    const valueB = b[sortField]
    
    let comparison = 0
    if (valueA > valueB) {
      comparison = 1
    } else if (valueA < valueB) {
      comparison = -1
    }
    
    return sortDirection === 'desc' ? comparison * -1 : comparison
  })
  
  // إعدادات الصفحات
  const itemsPerPage = 5
  const totalPages = Math.ceil(sortedCases.length / itemsPerPage)
  const paginatedCases = sortedCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // التعامل مع تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // محاكاة طلب البيانات من الخادم
    simulateLoading()
  }
  
  // معالجة الفرز
  const handleSort = (field: keyof Case) => {
    if (field === sortField) {
      // عكس اتجاه الفرز إذا تم النقر على نفس العمود
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // تعيين العمود الجديد واتجاه الفرز الافتراضي
      setSortField(field)
      setSortDirection('asc')
    }
    
    // محاكاة طلب البيانات من الخادم
    simulateLoading()
  }
  
  // معالجة تطبيق الفلاتر
  const handleFilterApply = (filters: {
    status?: string
    technician?: string
    dateRange?: { startDate?: string; endDate?: string }
    clientName?: string
  }) => {
    setActiveFilters({
      status: filters.status,
      technician: filters.technician,
      startDate: filters.dateRange?.startDate,
      endDate: filters.dateRange?.endDate,
      clientName: filters.clientName
    })
    setCurrentPage(1)  // إعادة تعيين الصفحة الحالية عند تغيير الفلترة
    
    // محاكاة طلب البيانات من الخادم
    simulateLoading()
  }
  
  // محاكاة تأخير طلب الخادم
  const simulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }
  
  return (
    <div className="py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">حالات الصيانة</h1>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          {/* مربع البحث */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="البحث عن حالة..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // تأخير البحث قليلاً للتحسين
                const delayDebounce = setTimeout(() => {
                  simulateLoading();
                }, 300);
                return () => clearTimeout(delayDebounce);
              }}
            />
          </div>
          
          {/* زر إضافة حالة جديدة */}
          <Link to="/cases/new" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة حالة جديدة
          </Link>
        </div>
      </div>
      
      {/* لوحة الفلترة */}
      <CasesFilterBar onFilterApply={handleFilterApply} />
      
      {/* جدول الحالات */}
      <CasesTable
        cases={paginatedCases}
        isLoading={isLoading}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default CasesList

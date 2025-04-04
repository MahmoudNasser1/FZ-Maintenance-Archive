import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/solid'
import MaintenanceChart from '../../components/dashboard/MaintenanceChart'

// مكون لعرض البطاقة الإحصائية
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  changeValue?: string | number
  changeType?: 'positive' | 'negative'
  iconBgColor: string
  iconColor: string
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, value, icon: Icon, changeValue, changeType, iconBgColor, iconColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgColor} ml-4`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-secondary-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </div>
      {changeValue && (
        <div className="mt-4 flex items-center text-sm">
          {changeType === 'positive' ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500 ml-1" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500 ml-1" />
          )}
          <span className={`${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeValue}
          </span>
          <span className="text-secondary-500 mr-1">مقارنة بالشهر السابق</span>
        </div>
      )}
    </div>
  )
}

// مكون عرض آخر الحالات
interface CaseItemProps {
  id: string
  deviceModel: string
  clientName: string
  status: string
  date: string
  technician: string
}

const CaseItem: React.FC<CaseItemProps> = ({ 
  id, deviceModel, clientName, status, date, technician
}) => {
  // تحديد لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم الإصلاح':
        return 'bg-green-100 text-green-800'
      case 'قيد الإصلاح':
        return 'bg-blue-100 text-blue-800'
      case 'بانتظار القطعة':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link to={`/cases/${id}`} className="block hover:bg-gray-50 rounded-lg transition-colors p-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-secondary-900">{deviceModel}</h4>
          <p className="text-sm text-secondary-500">{clientName}</p>
        </div>
        <div className="text-left">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          <p className="text-sm text-secondary-500 mt-1">{date}</p>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-xs text-secondary-500">الفني: {technician}</p>
      </div>
    </Link>
  )
}

// صفحة لوحة التحكم الرئيسية
const Dashboard: React.FC = () => {
  // بيانات توضيحية (في التطبيق الفعلي ستأتي من API)
  const stats = [
    { 
      title: 'حالات صيانة نشطة',
      value: 24,
      icon: ClipboardDocumentCheckIcon,
      changeValue: '15%',
      changeType: 'positive' as const,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      title: 'حالات تم إصلاحها اليوم',
      value: 8,
      icon: UsersIcon,
      changeValue: '12%',
      changeType: 'positive' as const,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      title: 'متوسط وقت الإصلاح',
      value: '3.2 ساعة',
      icon: ClockIcon,
      changeValue: '5%',
      changeType: 'negative' as const,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    { 
      title: 'النقاط المكتسبة',
      value: 2450,
      icon: CurrencyDollarIcon,
      changeValue: '20%',
      changeType: 'positive' as const,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ]

  // بيانات توضيحية للحالات (في التطبيق الفعلي ستأتي من API)
  const recentCases = [
    {
      id: '1',
      deviceModel: 'iPhone 12',
      clientName: 'عمر أحمد',
      status: 'قيد الإصلاح',
      date: '2 أبريل 2025',
      technician: 'محمد علي'
    },
    {
      id: '2',
      deviceModel: 'Samsung Galaxy S21',
      clientName: 'سارة محمد',
      status: 'بانتظار القطعة',
      date: '1 أبريل 2025',
      technician: 'محمد علي'
    },
    {
      id: '3',
      deviceModel: 'MacBook Pro',
      clientName: 'خالد إبراهيم',
      status: 'تم الإصلاح',
      date: '31 مارس 2025',
      technician: 'أحمد محمود'
    },
    {
      id: '4',
      deviceModel: 'Lenovo ThinkPad',
      clientName: 'نورا سمير',
      status: 'تم الإصلاح',
      date: '30 مارس 2025',
      technician: 'محمد علي'
    },
    {
      id: '5',
      deviceModel: 'Xiaomi Redmi Note 10',
      clientName: 'محمود عبد الرحمن',
      status: 'قيد الإصلاح',
      date: '30 مارس 2025',
      technician: 'أحمد محمود'
    }
  ]

  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم</h1>
      
      {/* القسم الإحصائي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* قسم أحدث الحالات */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">أحدث حالات الصيانة</h2>
          <Link to="/cases" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            عرض الكل
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCases.map((caseItem) => (
            <CaseItem key={caseItem.id} {...caseItem} />
          ))}
        </div>
      </div>

      {/* قسم الرسم البياني والنصائح */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الرسم البياني */}
        <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">أداء الأسبوع</h2>
            <div className="flex space-x-2 space-x-reverse">
              <select 
                className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
              >
                <option value="line">خط بياني</option>
                <option value="bar">رسم شريطي</option>
              </select>
              <select 
                className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 mr-2"
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
            </div>
          </div>
          {/* استخدام مكون المخطط البياني */}
          <MaintenanceChart type={chartType} period={chartPeriod} />
        </div>

        {/* النصائح والموارد */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">نصائح ذكية</h2>
          <ul className="space-y-4">
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 ml-3 flex-shrink-0">1</span>
              <div>
                <p className="text-sm text-secondary-700">مشكلة الشاشة في iPhone 12 غالبًا ما تكون بسبب كابل الشاشة</p>
              </div>
            </li>
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 ml-3 flex-shrink-0">2</span>
              <div>
                <p className="text-sm text-secondary-700">تأكد من فحص البطارية في Samsung Galaxy S21 لمشاكل الشحن</p>
              </div>
            </li>
            <li className="flex">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 ml-3 flex-shrink-0">3</span>
              <div>
                <p className="text-sm text-secondary-700">قم بعمل نسخة احتياطية قبل إصلاح MacBook Pro</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

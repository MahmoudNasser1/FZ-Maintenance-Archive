import { NavLink } from 'react-router-dom'
import { 
  HomeIcon, 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  isOpen: boolean
}

/**
 * مكون الشريط الجانبي
 * يعرض روابط التنقل الرئيسية والمعلومات عن المستخدم الحالي
 */
const Sidebar = ({ isOpen }: SidebarProps) => {
  // قائمة عناصر التنقل الرئيسية
  const navigationItems = [
    { name: 'لوحة التحكم', path: '/dashboard', icon: HomeIcon },
    { name: 'حالات الصيانة', path: '/cases', icon: ClipboardDocumentListIcon },
    { name: 'المخططات والموارد', path: '/resources', icon: DocumentTextIcon },
    { name: 'سجل العمل', path: '/work-logs', icon: WrenchScrewdriverIcon },
    { name: 'التقارير', path: '/reports', icon: ChartBarIcon },
    { name: 'الملف الشخصي', path: '/profile', icon: UserIcon },
  ]

  return (
    <div className={`bg-white shadow-md fixed inset-y-0 right-0 z-30 transform transition duration-300 ease-in-out 
                     ${isOpen ? 'translate-x-0 w-64' : 'translate-x-44 md:translate-x-0 md:w-20'} pt-16`}>
      <div className="h-full flex flex-col justify-between overflow-y-auto">
        {/* عناصر التنقل */}
        <nav className="px-4 py-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center p-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-primary-600'}
                  `}
                >
                  <item.icon className={`h-6 w-6 ${isOpen ? 'ml-3' : ''}`} />
                  {isOpen && <span>{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* معلومات المستخدم والإعدادات */}
        <div className="px-4 py-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className={`h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg ${isOpen ? 'ml-3' : ''}`}>
              ع
            </div>
            {isOpen && (
              <div>
                <h3 className="font-semibold text-secondary-800">علي محمد</h3>
                <p className="text-sm text-secondary-500">فني صيانة</p>
              </div>
            )}
          </div>
          
          {isOpen && (
            <button className="flex items-center w-full p-3 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors">
              <Cog6ToothIcon className="h-6 w-6 ml-3" />
              <span>الإعدادات</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar

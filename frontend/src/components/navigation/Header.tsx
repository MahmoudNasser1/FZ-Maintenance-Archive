import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'

interface HeaderProps {
  toggleSidebar: () => void
}

/**
 * مكون الشريط العلوي
 * يعرض شعار التطبيق وأزرار الإشعارات والبحث وقائمة المستخدم
 */
const Header = ({ toggleSidebar }: HeaderProps) => {
  const [isOnline, setIsOnline] = useState(true)
  const notificationsCount = 3

  // محاكاة تبديل حالة الاتصال (للعرض فقط)
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
  }

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-40 h-16">
      <div className="h-full flex items-center justify-between px-4">
        {/* زر القائمة وشعار التطبيق */}
        <div className="flex items-center">
          <button
            className="inline-flex items-center justify-center p-2 rounded-md text-secondary-600 hover:bg-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={toggleSidebar}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <Link to="/dashboard" className="ml-4 flex items-center">
            <img src="/logo.svg" alt="Fix Zone" className="h-8 hidden md:block" />
            <span className="text-lg font-bold text-primary-700 md:mr-2">أرشيف الصيانة</span>
          </Link>
        </div>

        {/* البحث والإشعارات وقائمة المستخدم */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* حالة الاتصال */}
          <button
            onClick={toggleOnlineStatus}
            className={`flex items-center text-xs rounded-full px-3 py-1 ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full mr-1 ${isOnline ? 'bg-green-600' : 'bg-red-600'}`}></span>
            {isOnline ? 'متصل' : 'غير متصل'}
          </button>

          {/* البحث */}
          <button className="p-2 rounded-full text-secondary-600 hover:bg-secondary-100">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </button>

          {/* الإشعارات */}
          <div className="relative">
            <button className="p-2 rounded-full text-secondary-600 hover:bg-secondary-100">
              <BellIcon className="h-6 w-6" />
              {notificationsCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-danger-500 rounded-full">
                  {notificationsCount}
                </span>
              )}
            </button>
          </div>

          {/* قائمة المستخدم */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-full text-secondary-600 hover:bg-secondary-100">
              <UserCircleIcon className="h-6 w-6" />
            </Menu.Button>

            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left bg-white rounded-md shadow-lg p-1 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link 
                      to="/profile" 
                      className={`flex items-center px-4 py-2 text-sm rounded-md ${active ? 'bg-secondary-100' : ''}`}
                    >
                      <UserCircleIcon className="ml-2 h-5 w-5" />
                      الملف الشخصي
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      className={`w-full text-right flex items-center px-4 py-2 text-sm rounded-md ${active ? 'bg-secondary-100' : ''}`}
                      onClick={() => {
                        // تسجيل الخروج
                        localStorage.removeItem('accessToken')
                        window.location.href = '/login'
                      }}
                    >
                      <ArrowRightOnRectangleIcon className="ml-2 h-5 w-5" />
                      تسجيل الخروج
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}

export default Header

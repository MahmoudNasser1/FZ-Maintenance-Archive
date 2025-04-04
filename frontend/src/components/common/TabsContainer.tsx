import React, { useState, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
  icon?: React.ElementType
}

interface TabsContainerProps {
  tabs: Tab[]
  defaultTabId?: string
}

/**
 * مكون علامات التبويب العام
 * يستخدم لعرض محتوى في علامات تبويب متعددة
 */
const TabsContainer: React.FC<TabsContainerProps> = ({ tabs, defaultTabId }) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id || '')

  // التبديل بين علامات التبويب
  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId)
  }

  // البحث عن علامة التبويب النشطة
  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0]

  return (
    <div>
      {/* شريط علامات التبويب */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8 space-x-reverse overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = tab.id === activeTabId
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon && <Icon className={`ml-2 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />}
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
      
      {/* محتوى علامة التبويب النشطة */}
      <div className="pt-4">
        {activeTab?.content}
      </div>
    </div>
  )
}

export default TabsContainer

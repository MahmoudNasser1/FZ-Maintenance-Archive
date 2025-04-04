import React from 'react'
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  WrenchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface StatCard {
  title: string
  value: number | string
  description: string
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon: React.FC<React.ComponentProps<'svg'>>
  color: string
}

interface CaseStatisticsProps {
  stats: {
    totalCases: number
    pendingCases: number
    completedCases: number
    avgResolutionTime: string
    newCasesPercentChange?: number
    completionRatePercentChange?: number
    pendingCasesPercentChange?: number
  }
}

/**
 * مكون إحصائيات الحالات
 * يعرض إحصائيات عامة عن حالات الصيانة في لوحة التحكم
 */
const CaseStatistics: React.FC<CaseStatisticsProps> = ({ stats }) => {
  // تعريف بطاقات الإحصائيات
  const statCards: StatCard[] = [
    {
      title: 'إجمالي الحالات',
      value: stats.totalCases,
      description: 'إجمالي حالات الصيانة في النظام',
      change: stats.newCasesPercentChange 
        ? {
            value: stats.newCasesPercentChange,
            type: stats.newCasesPercentChange >= 0 ? 'increase' : 'decrease'
          }
        : undefined,
      icon: ArrowTrendingUpIcon,
      color: 'bg-primary-50 text-primary-700'
    },
    {
      title: 'الحالات قيد المعالجة',
      value: stats.pendingCases,
      description: 'حالات صيانة نشطة قيد المعالجة',
      change: stats.pendingCasesPercentChange
        ? {
            value: Math.abs(stats.pendingCasesPercentChange),
            type: stats.pendingCasesPercentChange >= 0 ? 'increase' : 'decrease'
          }
        : undefined,
      icon: WrenchIcon,
      color: 'bg-amber-50 text-amber-700'
    },
    {
      title: 'الحالات المكتملة',
      value: stats.completedCases,
      description: 'حالات صيانة تم إكمالها',
      change: stats.completionRatePercentChange
        ? {
            value: stats.completionRatePercentChange,
            type: stats.completionRatePercentChange >= 0 ? 'increase' : 'decrease'
          }
        : undefined,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-700'
    },
    {
      title: 'متوسط وقت الإصلاح',
      value: stats.avgResolutionTime,
      description: 'متوسط الوقت لإكمال حالة صيانة',
      icon: ClockIcon,
      color: 'bg-blue-50 text-blue-700'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                {card.change && (
                  <span className={`ml-2 text-sm font-medium ${
                    card.change.type === 'increase'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {card.change.value}%
                    {card.change.type === 'increase' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  )
}

export default CaseStatistics

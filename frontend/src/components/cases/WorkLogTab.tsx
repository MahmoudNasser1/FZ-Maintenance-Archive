import React, { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  PlayIcon, 
  StopIcon,
  PauseIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

// واجهة سجل العمل
export interface WorkLog {
  id: string
  startTime: string
  endTime?: string
  totalDuration?: number // بالثواني
  technicianId: string
  technicianName: string
}

interface WorkLogTabProps {
  workLogs: WorkLog[]
  onStartWork: () => void
  onEndWork: () => void
  isActiveSession: boolean
  activeSessionStartTime?: string
  caseStatus: string
}

/**
 * مكون علامة تبويب سجل العمل
 * يعرض سجلات العمل ويتيح بدء وإنهاء جلسات العمل
 */
const WorkLogTab: React.FC<WorkLogTabProps> = ({ 
  workLogs, 
  onStartWork, 
  onEndWork,
  isActiveSession,
  activeSessionStartTime,
  caseStatus
}) => {
  const [currentTimer, setCurrentTimer] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  
  // تتبع الوقت المنقضي منذ بدء الجلسة النشطة
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isActiveSession && activeSessionStartTime && !isPaused) {
      const startTimeMs = new Date(activeSessionStartTime).getTime()
      
      // تحديث المؤقت كل ثانية
      interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeMs) / 1000)
        setCurrentTimer(elapsedSeconds)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActiveSession, activeSessionStartTime, isPaused])
  
  // تنسيق التاريخ والوقت
  const formatDateTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString('ar-EG', options)
  }
  
  // تنسيق المدة الزمنية (تحويل الثواني إلى ساعات:دقائق:ثواني)
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  // حساب إجمالي وقت العمل
  const calculateTotalTime = () => {
    const totalSeconds = workLogs.reduce((total, log) => {
      // إذا كان هناك وقت إجمالي محدد مسبقًا
      if (log.totalDuration) {
        return total + log.totalDuration
      }
      
      // حساب المدة من وقتي البداية والنهاية
      if (log.startTime && log.endTime) {
        const start = new Date(log.startTime).getTime()
        const end = new Date(log.endTime).getTime()
        return total + Math.floor((end - start) / 1000)
      }
      
      return total
    }, 0)
    
    // إضافة الوقت المنقضي في الجلسة النشطة (إذا وجدت)
    return totalSeconds + (isActiveSession ? currentTimer : 0)
  }
  
  // تبديل حالة الإيقاف المؤقت
  const togglePause = () => {
    setIsPaused(!isPaused)
  }
  
  // التحقق مما إذا كانت الحالة تسمح ببدء العمل
  const canStartWork = ['تم الاستلام', 'قيد الفحص', 'قيد الإصلاح', 'بانتظار القطعة'].includes(caseStatus)
  
  return (
    <div>
      {/* قسم بدء/إنهاء العمل */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">تتبع وقت العمل</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">إجمالي وقت العمل</p>
            <p className="text-2xl font-bold">{formatDuration(calculateTotalTime())}</p>
          </div>
          
          {isActiveSession ? (
            <div className="flex items-center">
              <div className="text-right ml-4">
                <p className="text-sm text-gray-500 mb-1">الجلسة الحالية</p>
                <p className="text-xl font-mono">{formatDuration(currentTimer)}</p>
              </div>
              
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={togglePause}
                  className={`p-3 rounded-full ${isPaused ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  {isPaused ? <PlayIcon className="h-6 w-6" /> : <PauseIcon className="h-6 w-6" />}
                </button>
                
                <button
                  onClick={onEndWork}
                  className="p-3 rounded-full bg-red-100 text-red-700"
                >
                  <StopIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onStartWork}
              disabled={!canStartWork}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                canStartWork 
                  ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <PlayIcon className="h-5 w-5 ml-2" />
              بدء العمل
            </button>
          )}
        </div>
        
        {isActiveSession && (
          <p className="text-sm text-gray-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 ml-1"></span>
            بدأت الجلسة في {activeSessionStartTime ? formatDateTime(activeSessionStartTime) : ''}
          </p>
        )}
      </div>
      
      {/* قائمة سجلات العمل السابقة */}
      <h3 className="text-md font-medium text-gray-900 mb-3">سجل العمل السابق</h3>
      
      {workLogs.length > 0 ? (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفني
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت البدء
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت الانتهاء
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.technicianName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {formatDateTime(log.startTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.endTime ? (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 ml-1" />
                        {formatDateTime(log.endTime)}
                      </div>
                    ) : (
                      <span className="text-yellow-600">جلسة نشطة</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.totalDuration && formatDuration(log.totalDuration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد سجلات عمل</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ العمل على هذه الحالة لتسجيل الوقت.</p>
        </div>
      )}
    </div>
  )
}

export default WorkLogTab

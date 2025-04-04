import React, { useState, useEffect } from 'react'
import ReportCard from '../components/reports/ReportCard'
import StatusDistributionChart from '../components/reports/StatusDistributionChart'
import TimelineChart, { TimelineDataPoint } from '../components/reports/TimelineChart'

/**
 * صفحة التقارير
 * تعرض تحليلات وإحصائيات مفصلة عن حالات الصيانة
 */
const Reports: React.FC = () => {
  // حالات التحميل
  const [isStatusChartLoading, setIsStatusChartLoading] = useState(false)
  const [isTimelineChartLoading, setIsTimelineChartLoading] = useState(false)
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false)
  
  // بيانات الرسومات البيانية
  const [statusData, setStatusData] = useState<{ status: string; count: number; color: string }[]>([])
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([])
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('week')
  
  // محاكاة جلب بيانات توزيع الحالات
  useEffect(() => {
    const fetchStatusData = async () => {
      setIsStatusChartLoading(true)
      
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // بيانات ثابتة للعرض التوضيحي
        setStatusData([
          { status: 'جديدة', count: 12, color: '#3b82f6' },
          { status: 'قيد الفحص', count: 8, color: '#8b5cf6' },
          { status: 'قيد الإصلاح', count: 15, color: '#f97316' },
          { status: 'بانتظار القطعة', count: 7, color: '#eab308' },
          { status: 'تم الإصلاح', count: 23, color: '#10b981' },
          { status: 'تم التسليم', count: 18, color: '#6366f1' },
          { status: 'ملغاة', count: 4, color: '#ef4444' }
        ])
      } catch (error) {
        console.error('Error fetching status data:', error)
      } finally {
        setIsStatusChartLoading(false)
      }
    }
    
    fetchStatusData()
  }, [])
  
  // محاكاة جلب بيانات الاتجاهات الزمنية
  useEffect(() => {
    const fetchTimelineData = async () => {
      setIsTimelineChartLoading(true)
      
      try {
        // محاكاة تأخير الشبكة
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // إنشاء فترة زمنية بناءً على النطاق المحدد
        const today = new Date()
        const data: TimelineDataPoint[] = []
        
        let days = 7
        if (dateRange === 'month') days = 30
        if (dateRange === 'quarter') days = 90
        
        // تقليل عدد النقاط للفترات الزمنية الكبيرة
        const interval = dateRange === 'week' ? 1 : dateRange === 'month' ? 3 : 7
        const points = Math.ceil(days / interval)
        
        for (let i = 0; i < points; i++) {
          const date = new Date()
          date.setDate(today.getDate() - (days - i * interval))
          
          // توليد بيانات عشوائية للعرض التوضيحي
          const newCases = Math.floor(Math.random() * 10) + 1
          const completedCases = Math.floor(Math.random() * 8) + 1
          const pendingCases = Math.floor(Math.random() * 15) + 10
          
          data.push({
            date: date.toISOString().split('T')[0],
            newCases,
            completedCases,
            pendingCases
          })
        }
        
        setTimelineData(data)
      } catch (error) {
        console.error('Error fetching timeline data:', error)
      } finally {
        setIsTimelineChartLoading(false)
      }
    }
    
    fetchTimelineData()
  }, [dateRange])
  
  // معالجة تحديث الرسم البياني
  const handleRefreshStatusChart = () => {
    // إعادة تحميل بيانات توزيع الحالات
    setIsStatusChartLoading(true)
    
    setTimeout(() => {
      // محاكاة تغيير البيانات
      const updatedData = [...statusData]
      updatedData.forEach(item => {
        item.count = item.count + Math.floor(Math.random() * 5) - 2
        if (item.count < 0) item.count = 0
      })
      
      setStatusData(updatedData)
      setIsStatusChartLoading(false)
    }, 1000)
  }
  
  // معالجة تحديث المخطط الزمني
  const handleRefreshTimelineChart = () => {
    // إعادة تحميل بيانات الاتجاهات الزمنية
    setIsTimelineChartLoading(true)
    
    setTimeout(() => {
      // محاكاة تغيير البيانات
      const updatedData = [...timelineData]
      updatedData.forEach(item => {
        if (item.newCases) item.newCases = Math.floor(Math.random() * 10) + 1
        if (item.completedCases) item.completedCases = Math.floor(Math.random() * 8) + 1
        if (item.pendingCases) item.pendingCases = Math.floor(Math.random() * 15) + 10
      })
      
      setTimelineData(updatedData)
      setIsTimelineChartLoading(false)
    }, 1500)
  }

  return (
    <div className="py-10">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
        <p className="mt-1 text-sm text-gray-500">
          تحليل شامل لبيانات حالات الصيانة والأداء
        </p>
      </div>
      
      {/* توزيع حالات الصيانة */}
      <div className="mb-8">
        <ReportCard
          title="توزيع حالات الصيانة"
          description="توزيع الحالات حسب الحالة الحالية"
          isLoading={isStatusChartLoading}
          onRefresh={handleRefreshStatusChart}
          onExport={() => alert('تم تصدير بيانات الرسم البياني')}
        >
          <StatusDistributionChart data={statusData} />
        </ReportCard>
      </div>
      
      {/* الاتجاهات الزمنية */}
      <div className="mb-8">
        <ReportCard
          title="الاتجاهات الزمنية"
          description="تحليل اتجاهات حالات الصيانة على مدار الوقت"
          isLoading={isTimelineChartLoading}
          onRefresh={handleRefreshTimelineChart}
          onExport={() => alert('تم تصدير بيانات الاتجاهات الزمنية')}
        >
          <div className="mb-4">
            <div className="flex justify-end">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setDateRange('week')}
                  className={`py-2 px-4 text-sm font-medium rounded-r-lg ${
                    dateRange === 'week'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  أسبوع
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('month')}
                  className={`py-2 px-4 text-sm font-medium ${
                    dateRange === 'month'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  شهر
                </button>
                <button
                  type="button"
                  onClick={() => setDateRange('quarter')}
                  className={`py-2 px-4 text-sm font-medium rounded-l-lg ${
                    dateRange === 'quarter'
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ربع سنوي
                </button>
              </div>
            </div>
          </div>
          
          <TimelineChart 
            data={timelineData} 
            height={300}
            showGridLines={true}
            showNewCases={true}
            showCompletedCases={true}
            showPendingCases={true}
          />
        </ReportCard>
      </div>
      
      {/* ملخص الأداء */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* أعلى الفنيين أداءً */}
        <ReportCard
          title="أعلى الفنيين أداءً"
          description="الفنيون الأكثر إنجازًا للحالات"
          isLoading={isPerformanceLoading}
        >
          <div className="space-y-4">
            {[
              { name: 'محمد علي', count: 32, percentage: 28 },
              { name: 'أحمد محمود', count: 27, percentage: 23 },
              { name: 'علي عبد الرحمن', count: 21, percentage: 18 },
              { name: 'نورا سمير', count: 18, percentage: 15 },
              { name: 'سارة محمد', count: 12, percentage: 10 }
            ].map((tech, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                  <span className="text-sm text-gray-500">{tech.count} حالة</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ width: `${tech.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
        
        {/* متوسط وقت الإصلاح */}
        <ReportCard
          title="متوسط وقت الإصلاح"
          description="متوسط الوقت المستغرق لإصلاح كل نوع من الأجهزة"
          isLoading={isPerformanceLoading}
        >
          <div className="space-y-4">
            {[
              { name: 'iPhone', time: '2.3 يوم', color: '#3b82f6' },
              { name: 'Samsung', time: '2.7 يوم', color: '#8b5cf6' },
              { name: 'Xiaomi', time: '1.8 يوم', color: '#10b981' },
              { name: 'Huawei', time: '2.1 يوم', color: '#f97316' },
              { name: 'أجهزة أخرى', time: '3.2 يوم', color: '#6b7280' }
            ].map((device, index) => (
              <div key={index} className="flex items-center">
                <span 
                  className="w-4 h-4 inline-block ml-2" 
                  style={{ backgroundColor: device.color }}
                ></span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{device.name}</span>
                    <span className="text-sm text-gray-500">{device.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      </div>
    </div>
  )
}

export default Reports

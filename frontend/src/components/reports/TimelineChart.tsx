import React from 'react'

export interface TimelineDataPoint {
  date: string
  newCases?: number
  completedCases?: number
  pendingCases?: number
}

interface TimelineChartProps {
  data: TimelineDataPoint[]
  height?: number
  showGridLines?: boolean
  showNewCases?: boolean
  showCompletedCases?: boolean
  showPendingCases?: boolean
}

/**
 * مكون رسم بياني خطي لعرض بيانات الحالات على مدى فترة زمنية
 */
const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  height = 300,
  showGridLines = true,
  showNewCases = true,
  showCompletedCases = true,
  showPendingCases = true
}) => {
  // التأكد من وجود بيانات
  if (!data.length) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-md">
        <p className="text-gray-500">لا توجد بيانات متاحة</p>
      </div>
    )
  }

  // دوال مساعدة لتاريخ البيانات
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
  }

  // حساب أعلى قيمة في البيانات لتحديد ارتفاع الرسم البياني
  const maxValue = Math.max(
    ...data.map(item => Math.max(
      showNewCases && item.newCases ? item.newCases : 0,
      showCompletedCases && item.completedCases ? item.completedCases : 0,
      showPendingCases && item.pendingCases ? item.pendingCases : 0
    ))
  )
  
  // إضافة هامش للحد الأقصى
  const chartMax = Math.ceil(maxValue * 1.1)

  // حساب عرض الرسم البياني
  const chartWidth = 1000
  // حساب المسافة بين النقاط
  const xStep = chartWidth / (data.length - 1)
  // حساب محور Y للنقاط
  const getYPosition = (value: number) => height - (value / chartMax * height)
  
  // إنشاء نقاط للخط
  const createLinePath = (dataPoints: number[]) => {
    return dataPoints
      .map((value, index) => {
        const x = index * xStep
        const y = getYPosition(value)
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  // إنشاء مسارات الرسم البياني
  const newCasesPath = showNewCases 
    ? createLinePath(data.map(d => d.newCases || 0)) 
    : ''
  
  const completedCasesPath = showCompletedCases 
    ? createLinePath(data.map(d => d.completedCases || 0)) 
    : ''
  
  const pendingCasesPath = showPendingCases 
    ? createLinePath(data.map(d => d.pendingCases || 0)) 
    : ''

  // إنشاء خطوط الشبكة
  const gridLines = showGridLines ? Array.from({ length: 5 }).map((_, index) => {
    const y = height * index / 4
    const gridValue = chartMax * (1 - index / 4)
    return (
      <g key={`grid-${index}`}>
        <line
          x1="0"
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeDasharray={index === 4 ? "0" : "5,5"}
        />
        <text
          x="-5"
          y={y}
          textAnchor="end"
          dominantBaseline="middle"
          className="text-xs text-gray-500"
        >
          {Math.round(gridValue)}
        </text>
      </g>
    )
  }) : null

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="mx-auto"
          style={{ minWidth: '600px' }}
        >
          {/* خلفية الرسم البياني */}
          <rect
            x="0"
            y="0"
            width={chartWidth}
            height={height}
            fill="#f9fafb"
          />

          {/* خطوط الشبكة */}
          {gridLines}

          {/* منطقة تحت الخط للحالات الجديدة */}
          {showNewCases && (
            <path
              d={`${newCasesPath} L ${(data.length - 1) * xStep} ${height} L 0 ${height} Z`}
              fill="#eff6ff"
              opacity="0.6"
            />
          )}

          {/* منطقة تحت الخط للحالات المكتملة */}
          {showCompletedCases && (
            <path
              d={`${completedCasesPath} L ${(data.length - 1) * xStep} ${height} L 0 ${height} Z`}
              fill="#ecfdf5"
              opacity="0.6"
            />
          )}

          {/* منطقة تحت الخط للحالات قيد المعالجة */}
          {showPendingCases && (
            <path
              d={`${pendingCasesPath} L ${(data.length - 1) * xStep} ${height} L 0 ${height} Z`}
              fill="#fff7ed"
              opacity="0.6"
            />
          )}

          {/* خطوط البيانات */}
          {showNewCases && (
            <path
              d={newCasesPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {showCompletedCases && (
            <path
              d={completedCasesPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {showPendingCases && (
            <path
              d={pendingCasesPath}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* النقاط على الخطوط */}
          {data.map((item, index) => (
            <g key={`points-${index}`}>
              {showNewCases && item.newCases !== undefined && (
                <circle
                  cx={index * xStep}
                  cy={getYPosition(item.newCases)}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="1"
                />
              )}
              
              {showCompletedCases && item.completedCases !== undefined && (
                <circle
                  cx={index * xStep}
                  cy={getYPosition(item.completedCases)}
                  r="4"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="1"
                />
              )}
              
              {showPendingCases && item.pendingCases !== undefined && (
                <circle
                  cx={index * xStep}
                  cy={getYPosition(item.pendingCases)}
                  r="4"
                  fill="#f97316"
                  stroke="white"
                  strokeWidth="1"
                />
              )}
            </g>
          ))}

          {/* تسميات محور X */}
          {data.map((item, index) => (
            <text
              key={`label-${index}`}
              x={index * xStep}
              y={height + 15}
              textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
              className="text-xs text-gray-500"
            >
              {formatDate(item.date)}
            </text>
          ))}
        </svg>
      </div>

      {/* مفتاح الرسم البياني */}
      <div className="flex justify-center mt-4 flex-wrap gap-4">
        {showNewCases && (
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block ml-1"></span>
            <span className="text-sm text-gray-700">حالات جديدة</span>
          </div>
        )}
        {showCompletedCases && (
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full inline-block ml-1"></span>
            <span className="text-sm text-gray-700">حالات مكتملة</span>
          </div>
        )}
        {showPendingCases && (
          <div className="flex items-center">
            <span className="w-3 h-3 bg-orange-500 rounded-full inline-block ml-1"></span>
            <span className="text-sm text-gray-700">حالات قيد المعالجة</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineChart

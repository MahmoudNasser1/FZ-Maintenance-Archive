import React from 'react'

interface StatusData {
  status: string
  count: number
  color: string
}

interface StatusDistributionChartProps {
  data: StatusData[]
}

/**
 * مكون رسم بياني دائري لعرض توزيع حالات الصيانة حسب الحالة
 */
const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  // حساب مجموع العدد الكلي للحالات
  const total = data.reduce((sum, item) => sum + item.count, 0)
  
  // حساب بدايات ونهايات الأقواس للرسم البياني
  const segments = data.map((item, index, array) => {
    // حساب النسبة المئوية لكل قطاع
    const percentage = (item.count / total) * 100
    
    // حساب زوايا البداية والنهاية
    let startAngle = 0
    for (let i = 0; i < index; i++) {
      startAngle += (array[i].count / total) * 360
    }
    const endAngle = startAngle + (percentage * 360) / 100
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle
    }
  })

  // تحويل الزاوية إلى إحداثيات سينية وجيبية للرسم البياني
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  // إنشاء مسار SVG للقطاع الدائري
  const createArc = (startAngle: number, endAngle: number, radius: number, centerX: number, centerY: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle)
    const end = polarToCartesian(centerX, centerY, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ")
  }

  // أبعاد الرسم البياني
  const size = 240
  const centerX = size / 2
  const centerY = size / 2
  const radius = size * 0.4
  const legendItemHeight = 25

  return (
    <div className="flex flex-col md:flex-row items-center justify-center">
      {/* الرسم البياني */}
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={createArc(segment.startAngle, segment.endAngle, radius, centerX, centerY)}
              fill={segment.color}
              stroke="#ffffff"
              strokeWidth="1"
            />
          ))}
          
          {/* دائرة داخلية لإنشاء تأثير حلقي */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={radius * 0.6} 
            fill="white" 
          />
          
          {/* عرض النسبة المئوية الكلية وعدد الحالات في المنتصف */}
          <text 
            x={centerX} 
            y={centerY - 10} 
            textAnchor="middle" 
            fontSize="16" 
            fontWeight="bold" 
            fill="#374151"
          >
            {total}
          </text>
          <text 
            x={centerX} 
            y={centerY + 14} 
            textAnchor="middle" 
            fontSize="14" 
            fill="#6B7280"
          >
            حالة
          </text>
        </svg>
      </div>
      
      {/* المفتاح */}
      <div className="mt-6 md:mt-0 md:mr-10 space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center">
            <span 
              className="w-4 h-4 inline-block ml-2" 
              style={{ backgroundColor: segment.color }}
            ></span>
            <span className="text-sm text-gray-600">
              {segment.status}
              <span className="text-gray-500 mr-2">
                ({segment.count} - {segment.percentage.toFixed(1)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatusDistributionChart

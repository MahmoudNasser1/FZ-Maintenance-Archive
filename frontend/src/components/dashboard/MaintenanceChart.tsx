import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// تسجيل مكونات Chart.js المطلوبة
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// تعريف واجهة البيانات للمخطط
interface MaintenanceChartProps {
  type: 'line' | 'bar';
  period: 'daily' | 'weekly' | 'monthly'; 
}

const MaintenanceChart: React.FC<MaintenanceChartProps> = ({ type, period }) => {
  // إعداد البيانات والتهيئة استنادًا إلى الفترة المحددة
  const getLabels = () => {
    switch (period) {
      case 'daily':
        return ['صباحًا', 'ظهرًا', 'عصرًا', 'مساءً'];
      case 'weekly':
        return ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      case 'monthly':
        return ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
      default:
        return ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
    }
  };

  // محاكاة بيانات مختلفة حسب الفترة المحددة
  const getData = () => {
    if (period === 'daily') {
      return {
        completed: [5, 8, 7, 4],
        pending: [3, 2, 4, 6],
        new: [8, 5, 3, 2]
      };
    } else if (period === 'weekly') {
      return {
        completed: [12, 15, 18, 14, 16, 10, 8],
        pending: [6, 5, 8, 9, 7, 6, 4],
        new: [8, 10, 7, 6, 9, 8, 5]
      };
    } else {
      return {
        completed: [45, 50, 38, 42],
        pending: [22, 18, 25, 20],
        new: [30, 35, 28, 25]
      };
    }
  };

  const chartData = {
    labels: getLabels(),
    datasets: [
      {
        label: 'تم الإصلاح',
        data: getData().completed,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: type === 'line' ? 0.3 : undefined,
      },
      {
        label: 'قيد الإصلاح',
        data: getData().pending,
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        tension: type === 'line' ? 0.3 : undefined,
      },
      {
        label: 'حالات جديدة',
        data: getData().new,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: type === 'line' ? 0.3 : undefined,
      },
    ],
  };

  // خيارات الرسم البياني
  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: '#4b5563',
        },
      },
      title: {
        display: true,
        text: period === 'daily'
          ? 'إحصائيات اليوم'
          : period === 'weekly'
            ? 'إحصائيات الأسبوع'
            : 'إحصائيات الشهر',
        color: '#1f2937',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'عدد الحالات',
          color: '#4b5563',
        },
        ticks: {
          color: '#6b7280',
        },
        grid: {
          color: '#e5e7eb',
        },
      },
      x: {
        title: {
          display: true,
          text: period === 'daily'
            ? 'فترات اليوم'
            : period === 'weekly'
              ? 'أيام الأسبوع'
              : 'أسابيع الشهر',
          color: '#4b5563',
        },
        ticks: {
          color: '#6b7280',
        },
        grid: {
          color: '#e5e7eb',
        },
      },
    },
  };

  return (
    <div className="h-64 md:h-80">
      {type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default MaintenanceChart;

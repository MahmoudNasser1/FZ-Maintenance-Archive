import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// u0627u0641u062au0631u0627u0636 u0623u0646 u0647u0630u0647 u0627u0644u0645u0643u0648u0646u0627u062a u0645u0648u062cu0648u062fu0629 u0641u064a u0627u0644u0645u0634u0631u0648u0639
const ReportCard = React.lazy(() => import('../../components/reports/ReportCard'));
const StatusDistributionChart = React.lazy(() => import('../../components/reports/StatusDistributionChart'));
const TimelineChart = React.lazy(() => import('../../components/reports/TimelineChart'));

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<string>('month'); // 'week', 'month', 'quarter', 'year'
  
  // u0628u064au0627u0646u0627u062a u0627u0641u062au0631u0627u0636u064au0629 u0644u0644u0625u062du0635u0627u0626u064au0627u062a
  const stats = {
    totalCases: 342,
    completedCases: 287,
    pendingCases: 32,
    inProgressCases: 23,
    averageResolutionTime: '2.4 u064au0648u0645',
    customerSatisfaction: '94%',
  };
  
  // u0628u064au0627u0646u0627u062a u0627u0641u062au0631u0627u0636u064au0629 u0644u062au0648u0632u064au0639 u0627u0644u062du0627u0644u0627u062a u062du0633u0628 u0627u0644u062du0627u0644u0629
  const statusDistribution = [
    { status: 'مكتملة', count: 287, color: '#10B981' },
    { status: 'قيد التنفيذ', count: 23, color: '#3B82F6' },
    { status: 'معلقة', count: 12, color: '#F59E0B' },
    { status: 'ملغاة', count: 20, color: '#EF4444' },
  ];
  
  // u0628u064au0627u0646u0627u062a u0627u0641u062au0631u0627u0636u064au0629 u0644u0644u062au0633u0644u0633u0644 u0627u0644u0632u0645u0646u064a
  const timelineData = [
    { date: '2025-03-01', newCases: 12, completedCases: 8, pendingCases: 4 },
    { date: '2025-03-07', newCases: 19, completedCases: 15, pendingCases: 7 },
    { date: '2025-03-14', newCases: 15, completedCases: 12, pendingCases: 6 },
    { date: '2025-03-21', newCases: 22, completedCases: 18, pendingCases: 9 },
    { date: '2025-03-28', newCases: 18, completedCases: 14, pendingCases: 5 },
    { date: '2025-04-04', newCases: 14, completedCases: 10, pendingCases: 3 },
  ];
  
  // u0628u064au0627u0646u0627u062a u0627u0641u062au0631u0627u0636u064au0629 u0644u0641u0626u0627u062a u0627u0644u0635u064au0627u0646u0629
  const categoryData = [
    { name: 'كهربائية', count: 135, percentage: 39 },
    { name: 'ميكانيكية', count: 98, percentage: 29 },
    { name: 'سباكة', count: 56, percentage: 16 },
    { name: 'تكييف', count: 34, percentage: 10 },
    { name: 'أخرى', count: 19, percentage: 6 },
    { name: 'u0633u0628u0627u0643u0629', count: 56, percentage: 16 },
    { name: 'u062au0643u064au064au0641', count: 34, percentage: 10 },
    { name: 'u0623u062eu0631u0649', count: 19, percentage: 6 },
  ];

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <label htmlFor="date-range" className="text-sm font-medium text-gray-700">
            {t('reports.dateRange')}:
          </label>
          <select
            id="date-range"
            value={dateRange}
            onChange={handleDateRangeChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">{t('reports.lastWeek')}</option>
            <option value="month">{t('reports.lastMonth')}</option>
            <option value="quarter">{t('reports.lastQuarter')}</option>
            <option value="year">{t('reports.lastYear')}</option>
          </select>
          
          <button 
            className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md flex items-center"
            onClick={() => alert(t('reports.downloadConfirm'))}
          >
            <span className="mr-2 rtl:ml-2">u2b07ufe0f</span> {t('reports.export')}
          </button>
        </div>
      </div>
      
      {/* u0628u0637u0627u0642u0627u062a u0625u062du0635u0627u0626u064au0629 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ReportCard title={t('reports.totalCases')} description="+5% من الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-900">{stats.totalCases}</div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </ReportCard>
        <ReportCard title={t('reports.completedCases')} description="+8% من الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">{stats.completedCases}</div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </ReportCard>
        <ReportCard title={t('reports.pendingCases')} description="-12% من الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-yellow-500">{stats.pendingCases}</div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </ReportCard>
        <ReportCard title={t('reports.inProgressCases')} description="-3% من الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-blue-600">{stats.inProgressCases}</div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🛠️</span>
            </div>
          </div>
        </ReportCard>
        <ReportCard title={t('reports.avgResolutionTime')} description="تحسن 0.3 يوم عن الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-gray-800">{stats.averageResolutionTime}</div>
            <div className="p-3 bg-gray-100 rounded-full">
              <span className="text-2xl">⏱</span>
            </div>
          </div>
        </ReportCard>
        <ReportCard title={t('reports.customerSatisfaction')} description="+2% من الشهر الماضي">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">{stats.customerSatisfaction}</div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">😊</span>
            </div>
          </div>
        </ReportCard>
      </div>
      
      {/* u0645u062eu0637u0637u0627u062a u0628u064au0627u0646u064au0629 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('reports.statusDistribution')}</h2>
          <StatusDistributionChart data={statusDistribution} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('reports.casesOverTime')}</h2>
          <TimelineChart data={timelineData} />
        </div>
      </div>
      
      {/* u062cu062fu0648u0644 u0641u0626u0627u062a u0627u0644u0635u064au0627u0646u0629 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('reports.maintenanceCategories')}</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-3 px-6 text-right rtl:text-left bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.category')}
                </th>
                <th className="py-3 px-6 text-right rtl:text-left bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.count')}
                </th>
                <th className="py-3 px-6 text-right rtl:text-left bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.percentage')}
                </th>
                <th className="py-3 px-6 text-right rtl:text-left bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('reports.trend')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((category, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {category.count}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2 rtl:ml-2">{category.percentage}%</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      &#8593; 5%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* u0627u0644u0645u0644u062eu0635 u0648u0627u0644u062au0648u0635u064au0627u062a */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">{t('reports.summaryAndRecommendations')}</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">{t('reports.summary')}</h3>
          <p className="text-gray-700">
            {t('reports.summaryContent')}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">{t('reports.recommendations')}</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>{t('reports.recommendation1')}</li>
            <li>{t('reports.recommendation2')}</li>
            <li>{t('reports.recommendation3')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reports;

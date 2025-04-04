import React from 'react';
import { useTranslation } from 'react-i18next';

const Resources: React.FC = () => {
  const { t } = useTranslation();
  
  // بيانات الموارد الافتراضية
  const resources = [
    {
      id: 1,
      title: 'دليل استخدام النظام',
      description: 'دليل شامل لاستخدام نظام أرشيف الصيانة',
      type: 'pdf',
      size: '2.5 MB',
      date: '2025-03-15',
    },
    {
      id: 2,
      title: 'نماذج طلبات الصيانة',
      description: 'مجموعة من النماذج القابلة للتنزيل لطلبات الصيانة',
      type: 'zip',
      size: '1.8 MB',
      date: '2025-03-10',
    },
    {
      id: 3,
      title: 'فيديو تدريبي - إدارة الحالات',
      description: 'شرح مفصل لكيفية إدارة حالات الصيانة في النظام',
      type: 'video',
      size: '45 MB',
      date: '2025-02-28',
    },
    {
      id: 4,
      title: 'كتيب المواصفات الفنية',
      description: 'معلومات فنية عن الأجهزة والمعدات المدعومة',
      type: 'pdf',
      size: '4.2 MB',
      date: '2025-02-20',
    },
  ];

  // رموز لأنواع الملفات
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'zip':
        return '🗃️';
      case 'video':
        return '🎬';
      default:
        return '📁';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('resources.title')}</h1>
        <div className="flex space-x-4 rtl:space-x-reverse">
          <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md flex items-center" dir="auto">
            <span className="ltr:mr-2 rtl:ml-2">ud83dudcc1</span>
            {t('resources.uploadResource')}
          </button>
          <div className="relative">
            <input 
              type="text" 
              placeholder={t('common.search')}
              className="border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-gray-400" aria-hidden="true">🔍</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-gray-200">
          {resources.map(resource => (
            <div key={resource.id} className="p-6 transition duration-150 ease-in-out hover:bg-gray-50">
              <div className="flex items-start">
                <div className="flex-shrink-0 text-4xl mr-4 rtl:mr-0 rtl:ml-4">
                  {getFileIcon(resource.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium text-primary-600">{resource.title}</h3>
                      <p className="text-gray-600 mt-1">{resource.description}</p>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <button className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200 flex items-center" dir="auto">
                        <span className="ltr:mr-1 rtl:ml-1">u2b07ufe0f</span>
                        {t('resources.download')}
                      </button>
                      <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200 flex items-center" dir="auto">
                        <span className="ltr:mr-1 rtl:ml-1">ud83dudc41ufe0f</span>
                        {t('resources.view')}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-3 space-x-4 rtl:space-x-reverse">
                    <span>{t('resources.type')}: {resource.type.toUpperCase()}</span>
                    <span>{t('resources.size')}: {resource.size}</span>
                    <span>{t('resources.uploaded')}: {new Date(resource.date).toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {resources.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-4xl mb-4">📂</div>
          <h3 className="text-xl font-medium mb-2">{t('resources.noResources')}</h3>
          <p className="text-gray-600 mb-6">{t('resources.noResourcesDesc')}</p>
          <button className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md">
            {t('resources.uploadFirst')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Resources;

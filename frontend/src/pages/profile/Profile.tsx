import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // تحديث اتجاه حقول الإدخال بناءً على اللغة الحالية
  useEffect(() => {
    const isRTL = i18n.dir() === 'rtl';
    document.querySelectorAll('input').forEach(input => {
      if (input.type === 'email' || input.type === 'tel') {
        input.dir = 'ltr';
      }
    });
  }, [i18n.language]);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('profile.personalInfo')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.fullName')}</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue="أحمد محمد"
                dir="auto"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.email')}</label>
              <input 
                type="email" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue="ahmed@example.com"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.phone')}</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                defaultValue="+20 123 456 7890"
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <span className="text-4xl text-gray-400" aria-hidden="true">👤</span>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center">
              <span className="ltr:mr-2 rtl:ml-2">🖼️</span>
              {t('profile.updateAvatar')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('profile.security')}</h2>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.currentPassword')}</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.newPassword')}</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.confirmPassword')}</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 mt-2 flex items-center">
            <span className="ltr:mr-2 rtl:ml-2">🔒</span>
            {t('profile.changePassword')}
          </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 flex items-center">
          <span className="ltr:mr-2 rtl:ml-2">💾</span>
          {t('profile.updateProfile')}
        </button>
      </div>
    </div>
  );
};

export default Profile;

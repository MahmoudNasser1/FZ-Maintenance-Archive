import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">{t('common.notFound')}</h2>
        <p className="text-gray-600 mb-8">
          {t('common.pageNotFound')}
        </p>
        <Link 
          to="/dashboard" 
          className="bg-primary-600 text-white font-medium py-2 px-6 rounded-md hover:bg-primary-700 transition-colors"
        >
          {t('common.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

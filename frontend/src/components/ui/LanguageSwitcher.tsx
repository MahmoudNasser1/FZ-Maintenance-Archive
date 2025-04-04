import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL, setDocumentDirection } from '../../i18n';

// مكون تغيير اللغة
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  // تغيير اللغة
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // تطبيق الاتجاه المناسب عند تغيير اللغة
  useEffect(() => {
    setDocumentDirection(i18n.language);
  }, [i18n.language]);

  // تحديد ما إذا كانت اللغة الحالية هي العربية
  const isArabic = i18n.language === 'ar';

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        className={`px-2 py-1 rounded ${isArabic ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        onClick={() => changeLanguage('ar')}
        aria-label="تغيير اللغة إلى العربية"
      >
        العربية
      </button>
      <button
        className={`px-2 py-1 rounded ${!isArabic ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        onClick={() => changeLanguage('en')}
        aria-label="Change language to English"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;

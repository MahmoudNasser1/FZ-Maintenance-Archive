import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import rtlDetect from 'rtl-detect';

// التعريف بنوع ImportMeta لـ Vite
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      PROD: boolean;
      MODE: string;
    };
  }
}

// إعداد i18n مع الدعم المناسب للغة العربية
i18n
  // استخدام Backend للتحميل الديناميكي لملفات الترجمة
  .use(Backend)
  // اكتشاف اللغة تلقائيًا
  .use(LanguageDetector)
  // ربط مع React
  .use(initReactI18next)
  .init({
    // اللغة الافتراضية
    fallbackLng: 'ar',
    // اللغات المدعومة
    supportedLngs: ['ar', 'en'],
    // تمكين تصحيح اللغة
    debug: import.meta.env.DEV || false, // استخدام Vite env بدلاً من process
    // مكان ملفات الترجمة
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    // الفاصل المستخدم في مفاتيح الترجمة
    keySeparator: '.',
    // تعطيل escape في React
    interpolation: {
      escapeValue: false,
    },
    // تعيين الاتجاه بناءً على اللغة
    react: {
      useSuspense: true,
    },
  });

// إضافة وظيفة مساعدة للتحقق من اتجاه اللغة
export const isRTL = (language: string = i18n.language): boolean => {
  return rtlDetect.isRtlLang(language) || false; // إضافة || false لضمان إرجاع قيمة boolean
};

// إضافة العنصر dir لعنصر html استنادًا إلى اللغة الحالية
export const setDocumentDirection = (language: string = i18n.language): void => {
  document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
  
  // إضافة class لـ body للتحكم في اتجاه عرض العناصر
  if (isRTL(language)) {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
};

// تحديث اتجاه الصفحة عند تغيير اللغة
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);
});

// تعيين الاتجاه عند بدء تشغيل التطبيق
setDocumentDirection();

export default i18n;

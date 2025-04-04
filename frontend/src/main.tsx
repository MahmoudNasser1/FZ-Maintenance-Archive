import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App'
import './styles/index.css'
// استيراد ملف i18n
import './i18n'

// إنشاء عميل React Query للتعامل مع طلبات API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    },
  },
})

// تحميل الخط العربي من Google Fonts
// قمنا بإضافة هذا هنا لضمان تحميل الخط قبل عرض واجهة المستخدم
const loadFonts = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);
};

loadFonts();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

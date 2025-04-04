/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // اللون الرئيسي
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        secondary: {
          50: '#F9FAFB',
          100: '#F3F4F6', // اللون الثانوي
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937', // لون النص الرئيسي
          900: '#111827',
          950: '#030712',
        },
        success: {
          500: '#10B981', // لون التأكيد
        },
        warning: {
          500: '#F59E0B', // لون التحذير
        },
        danger: {
          500: '#EF4444', // لون الخطأ
        },
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      direction: {
        'rtl': 'rtl',
      },
    },
  },
  plugins: [],
}

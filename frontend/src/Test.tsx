import React from 'react';

const Test: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">اختبار نظام أرشيف الصيانة</h1>
        <p className="text-gray-700 mb-4">هذه صفحة اختبار بسيطة للتأكد من عمل React بشكل صحيح</p>
        <div className="flex justify-center">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => alert('تم النقر على الزر!')}
          >
            انقر هنا
          </button>
        </div>
      </div>
    </div>
  );
};

export default Test;

import React from 'react';

function SimpleApp() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#333', marginBottom: '16px' }}>مرحبًا بك في نظام أرشيف الصيانة</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>هذه صفحة بسيطة للتأكد من عمل React</p>
        <button 
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => alert('تم النقر على الزر بنجاح!')}
        >
          انقر هنا
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;

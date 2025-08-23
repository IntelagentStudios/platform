'use client';

export default function TestFormPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Direct Form Test</h1>
      <form action="/api/auth/login-redirect" method="POST">
        <input type="hidden" name="email" value="harry@intelagentstudios.com" />
        <input type="hidden" name="password" value="Birksgrange226!" />
        <button type="submit" style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Test Login with Form Submit
        </button>
      </form>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Manual Redirect Test</h2>
        <button 
          onClick={() => {
            console.log('Redirecting to dashboard...');
            window.location.href = '/dashboard';
          }}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Manual Redirect to Dashboard
        </button>
      </div>
    </div>
  );
}
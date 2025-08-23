export default function LoginSuccessPage() {
  return (
    <>
      <head>
        <meta httpEquiv="refresh" content="0; url=/dashboard" />
      </head>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Login Successful!</h1>
        <p>Redirecting to dashboard...</p>
        <p>If you are not redirected, <a href="/dashboard">click here</a></p>
      </div>
    </>
  );
}
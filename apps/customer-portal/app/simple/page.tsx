export default function SimplePage() {
  return (
    <div>
      <h1>Simple Page Works!</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <a href="/dashboard">Try Dashboard Link</a>
    </div>
  );
}
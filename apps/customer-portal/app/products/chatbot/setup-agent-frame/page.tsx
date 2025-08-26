'use client';

import { useEffect, useState } from 'react';

export default function SetupAgentFramePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Get the N8N webhook URL - this should connect to your Setup Agent workflow
  const WEBHOOK_URL = "https://1ntelagent.up.railway.app/webhook/setup";
  
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      background: 'rgb(48, 54, 54)'
    }}>
      <iframe
        src={`/api/products/chatbot/setup-agent-frame`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Setup Agent"
      />
    </div>
  );
}
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SparklesIcon, ChatBubbleLeftRightIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface AgentBuilderAIProps {
  onConfigUpdate: (config: any) => void;
  currentConfig?: any;
  height?: string;
}

export default function AgentBuilderAI({
  onConfigUpdate,
  currentConfig,
  height = '450px'
}: AgentBuilderAIProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWidget, setHasWidget] = useState(false);

  useEffect(() => {
    // Special product key for the agent builder chatbot
    const AGENT_BUILDER_KEY = 'PK-AGENT-BUILDER-AI';

    // Function to inject the chatbot widget
    const loadChatbot = () => {
      // Remove any existing widget first
      const existingWidget = document.getElementById('agent-builder-chatbot');
      if (existingWidget) {
        existingWidget.remove();
      }

      // Create container for the chatbot
      const widgetContainer = document.createElement('div');
      widgetContainer.id = 'agent-builder-chatbot';
      widgetContainer.style.cssText = `
        position: relative;
        width: 100%;
        height: ${height};
        border-radius: 12px;
        overflow: hidden;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      `;

      // Add iframe for the chatbot
      const iframe = document.createElement('iframe');
      iframe.src = `/api/widget/agent-builder?key=${AGENT_BUILDER_KEY}&config=${encodeURIComponent(JSON.stringify(currentConfig || {}))}`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
      `;
      iframe.onload = () => {
        setIsLoading(false);
        setHasWidget(true);
      };

      widgetContainer.appendChild(iframe);

      // Add to our container
      if (containerRef.current) {
        containerRef.current.appendChild(widgetContainer);
      }

      // Set up message listener for configuration updates
      window.addEventListener('message', handleMessage);
    };

    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from our own origin
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'agent-config-update') {
        onConfigUpdate(event.data.config);
      }
    };

    // Load the chatbot
    loadChatbot();

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      const widget = document.getElementById('agent-builder-chatbot');
      if (widget) {
        widget.remove();
      }
    };
  }, [height, onConfigUpdate, currentConfig]);

  // Send current config updates to the iframe
  useEffect(() => {
    if (hasWidget && currentConfig) {
      const iframe = document.querySelector('#agent-builder-chatbot iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'config-update',
          config: currentConfig
        }, window.location.origin);
      }
    }
  }, [currentConfig, hasWidget]);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <CpuChipIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Configuration Expert</h3>
              <p className="text-xs opacity-90">Powered by Intelagent AI • 539+ Skills Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-xl z-20">
          <div className="text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-purple-600/30 border-t-purple-600 animate-spin mx-auto"></div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-sm text-gray-300">Connecting to AI Expert...</p>
            <p className="mt-1 text-xs text-gray-400">This uses your actual chatbot product</p>
          </div>
        </div>
      )}

      {/* Chatbot Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
        style={{ paddingTop: '80px' }}
      />

      {/* Fallback Message */}
      {!hasWidget && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
          <div className="text-center p-6">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-300 mb-2">AI Expert Unavailable</h4>
            <p className="text-sm text-gray-400 mb-4">
              The AI configuration expert is temporarily offline.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
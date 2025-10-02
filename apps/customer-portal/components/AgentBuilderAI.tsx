'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SparklesIcon, ChatBubbleLeftRightIcon, CpuChipIcon } from '@heroicons/react/24/outline';

interface AgentBuilderAIProps {
  onConfigUpdate: (config: any) => void;
  currentConfig?: any;
  availableSkills?: string[];
  availableFeatures?: string[];
  availableIntegrations?: string[];
  pricingInfo?: any;
  height?: string;
}

export default function AgentBuilderAI({
  onConfigUpdate,
  currentConfig,
  availableSkills,
  availableFeatures,
  availableIntegrations,
  pricingInfo,
  height = '360px'
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
        background: rgba(58, 64, 64, 0.3);
        border: 1px solid rgba(169, 189, 203, 0.15);
      `;

      // Add iframe for the chatbot with full context
      const iframe = document.createElement('iframe');
      const fullContext = {
        config: currentConfig || {},
        availableSkills: availableSkills || [],
        availableFeatures: availableFeatures || [],
        availableIntegrations: availableIntegrations || [],
        pricing: pricingInfo || {}
      };
      iframe.src = `/api/widget/agent-builder?key=${AGENT_BUILDER_KEY}&context=${encodeURIComponent(JSON.stringify(fullContext))}`;
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
  }, [height, onConfigUpdate, currentConfig, availableSkills, availableFeatures, availableIntegrations, pricingInfo]);

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
      <div className="absolute top-0 left-0 right-0 p-4 rounded-t-xl z-10" style={{
        backgroundColor: 'rgba(58, 64, 64, 0.5)',
        borderBottom: '1px solid rgba(169, 189, 203, 0.15)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
              <CpuChipIcon className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>AI Configuration Expert</h3>
              <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Powered by Intelagent AI • 539+ Skills Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 animate-pulse" style={{ color: 'rgb(169, 189, 203)' }} />
            <span className="text-sm font-medium" style={{ color: 'rgba(229, 227, 220, 0.9)' }}>Active</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-xl z-20" style={{
          backgroundColor: 'rgba(30, 33, 33, 0.8)'
        }}>
          <div className="text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 animate-spin mx-auto" style={{
                borderColor: 'rgba(169, 189, 203, 0.2)',
                borderTopColor: 'rgb(169, 189, 203)'
              }}></div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ color: 'rgb(169, 189, 203)' }} />
            </div>
            <p className="mt-4 text-sm" style={{ color: 'rgb(229, 227, 220)' }}>Connecting to AI Expert...</p>
            <p className="mt-1 text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>This uses your actual chatbot product</p>
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
        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{
          backgroundColor: 'rgba(30, 33, 33, 0.95)'
        }}>
          <div className="text-center p-6">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
            <h4 className="text-lg font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>AI Expert Unavailable</h4>
            <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
              The AI configuration expert is temporarily offline.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg transition hover:opacity-80"
              style={{
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'rgb(30, 33, 33)'
              }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
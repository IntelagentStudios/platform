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
  versionInfo?: {
    current: number;
    total: number;
    canUndo: boolean;
    canRedo: boolean;
  };
  height?: string | 'auto';
}

export default function AgentBuilderAI({
  onConfigUpdate,
  currentConfig,
  availableSkills,
  availableFeatures,
  availableIntegrations,
  pricingInfo,
  height = '400px'
}: AgentBuilderAIProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWidget, setHasWidget] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Special product key for the agent builder chatbot
    const AGENT_BUILDER_KEY = 'PK-AGENT-BUILDER-AI';

    // Function to inject the chatbot widget
    const loadChatbot = () => {
      // Don't reload if already exists
      if (hasWidget) {
        return;
      }

      // Remove any existing widget first
      const existingWidget = document.getElementById('agent-builder-chatbot');
      if (existingWidget) {
        existingWidget.remove();
      }

      // Create container for the chatbot
      const widgetContainer = document.createElement('div');
      widgetContainer.id = 'agent-builder-chatbot';
      widgetContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        overflow: hidden;
        background: transparent;
      `;

      // Add iframe for the chatbot without context in URL (too large)
      const iframe = document.createElement('iframe');
      iframe.src = `/api/widget/agent-builder?key=${AGENT_BUILDER_KEY}`;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
      `;
      iframe.onload = () => {
        setIsLoading(false);
        setHasWidget(true);
        iframeRef.current = iframe;

        // Send context after iframe loads
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'initial-context',
              config: currentConfig || {},
              availableSkills: availableSkills || [],
              availableFeatures: availableFeatures || [],
              availableIntegrations: availableIntegrations || [],
              pricing: pricingInfo || {},
              versionInfo: versionInfo || null
            }, window.location.origin);
          }
        }, 100);
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
        console.log('Received config update from AI:', event.data.config);
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
  }, []); // Only run once on mount, not on prop changes

  // Send current config updates to the iframe
  useEffect(() => {
    if (hasWidget && currentConfig) {
      const iframe = document.querySelector('#agent-builder-chatbot iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'config-update',
          config: currentConfig,
          versionInfo: versionInfo || null
        }, window.location.origin);
      }
    }
  }, [currentConfig, hasWidget, versionInfo]);

  return (
    <div className="relative w-full" style={{ height, backgroundColor: 'rgba(58, 64, 64, 0.3)', border: '1px solid rgba(169, 189, 203, 0.15)', borderRadius: '12px', overflow: 'hidden' }}>


      {/* Chatbot Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full"
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
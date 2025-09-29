'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface EmbeddedChatbotProps {
  title?: string;
  placeholder?: string;
  welcomeMessage?: string;
  embedded?: boolean;
  onSend?: (message: string) => void;
  height?: string;
}

export default function EmbeddedChatbot({
  title = 'AI Assistant',
  placeholder = 'Type your message...',
  welcomeMessage = "Hello! I'm your AI assistant. How can I help you today?",
  embedded = true,
  onSend,
  height = '500px'
}: EmbeddedChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: welcomeMessage,
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Call onSend callback if provided
    if (onSend) {
      onSend(input);
    }

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "I understand your requirements. Let me help you configure the perfect solution.",
        "That's a great approach! I can set up those features for you.",
        "Based on what you've told me, I recommend adding these capabilities to your agent.",
        "I've analyzed your needs and prepared an optimal configuration.",
        "Perfect! I've updated your agent with the requested features."
      ];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const containerStyle = embedded ? {
    height,
    backgroundColor: 'rgba(48, 54, 54, 0.3)',
    border: '1px solid rgba(169, 189, 203, 0.15)',
    borderRadius: '0.75rem'
  } : {
    position: 'fixed' as const,
    bottom: '1rem',
    right: '1rem',
    width: '24rem',
    height: '32rem',
    backgroundColor: 'rgb(48, 54, 54)',
    border: '1px solid rgba(169, 189, 203, 0.2)',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  };

  return (
    <div className="flex flex-col" style={containerStyle}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(58, 64, 64, 0.3)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}>
            <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
              {title}
            </h3>
            <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
              Powered by Intelagent AI
            </span>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          color: 'rgb(34, 197, 94)'
        }}>
          Online
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                message.sender === 'user'
                  ? ''
                  : ''
              }`}
              style={{
                backgroundColor: message.sender === 'user'
                  ? 'rgba(169, 189, 203, 0.2)'
                  : 'rgba(58, 64, 64, 0.5)',
                color: 'rgb(229, 227, 220)',
                border: message.sender === 'assistant'
                  ? '1px solid rgba(169, 189, 203, 0.15)'
                  : 'none'
              }}
            >
              {message.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-lg"
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}
            >
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '0ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '150ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '300ms'
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(48, 54, 54, 0.3)'
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)',
              color: 'rgb(229, 227, 220)'
            }}
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 rounded-lg transition hover:opacity-80 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}
          >
            <PaperAirplaneIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  HelpCircle,
  Bug,
  Zap,
  CreditCard,
  Shield,
  Settings
} from 'lucide-react';

const ISSUE_TYPES = [
  { id: 'general', label: 'General Question', icon: HelpCircle, agent: 'communications' },
  { id: 'technical', label: 'Technical Issue', icon: Bug, agent: 'infrastructure' },
  { id: 'feature', label: 'Feature Request', icon: Zap, agent: 'operations' },
  { id: 'billing', label: 'Billing & Payment', icon: CreditCard, agent: 'finance' },
  { id: 'security', label: 'Security Concern', icon: Shield, agent: 'security' },
  { id: 'integration', label: 'Integration Help', icon: Settings, agent: 'integration' }
];

export default function SupportPage() {
  const router = useRouter();
  const [issueType, setIssueType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Route to appropriate management agent
      const selectedType = ISSUE_TYPES.find(t => t.id === issueType);

      const response = await fetch('/api/support/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: issueType,
          agent: selectedType?.agent || 'communications',
          subject,
          message,
          priority,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'customer-portal'
          }
        })
      });

      const data = await response.json();
      setTicketId(data.ticketId);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting support request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Your support request has been received and routed to the appropriate team.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Ticket ID</p>
              <p className="text-xl font-mono font-semibold text-gray-900">{ticketId}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Our management agents are processing your request. You'll receive an email update shortly.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">
            Our AI-powered management team is here to help. Your request will be automatically routed to the right specialist.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What can we help you with?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ISSUE_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setIssueType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        issueType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 mx-auto ${
                        issueType === type.id ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm ${
                        issueType === type.id ? 'text-blue-900 font-medium' : 'text-gray-600'
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low - General inquiry</option>
                <option value="normal">Normal - Standard issue</option>
                <option value="high">High - Impacting business</option>
                <option value="urgent">Urgent - Service down</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                placeholder="Please provide as much detail as possible..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Agent Assignment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Intelligent Routing</p>
                  <p className="text-blue-700">
                    Your request will be automatically assigned to the {
                      ISSUE_TYPES.find(t => t.id === issueType)?.agent
                    } agent for fastest resolution.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !subject || !message}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Support Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Expected Response Times */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Expected Response Times
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Urgent:</span>
              <p className="font-medium text-gray-900">Within 1 hour</p>
            </div>
            <div>
              <span className="text-gray-500">High:</span>
              <p className="font-medium text-gray-900">Within 4 hours</p>
            </div>
            <div>
              <span className="text-gray-500">Normal:</span>
              <p className="font-medium text-gray-900">Within 24 hours</p>
            </div>
            <div>
              <span className="text-gray-500">Low:</span>
              <p className="font-medium text-gray-900">Within 48 hours</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
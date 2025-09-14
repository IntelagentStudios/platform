'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  RefreshCw,
  Shield,
  Bug,
  CreditCard,
  Settings,
  HelpCircle,
  Zap
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketId: string;
  type: string;
  agent: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  customer: {
    email: string;
    name: string;
    licenseKey: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AGENT_ICONS: Record<string, any> = {
  communications: MessageSquare,
  infrastructure: Bug,
  operations: Zap,
  finance: CreditCard,
  security: Shield,
  integration: Settings
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/support/tickets');
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.ticketId === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.customer.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group tickets by status for overview
  const ticketsByStatus = {
    open: tickets.filter(t => t.status === 'open').length,
    'in-progress': tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Management</h1>
          <p className="text-gray-600">AI agents are handling customer support requests</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{ticketsByStatus.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{ticketsByStatus['in-progress']}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{ticketsByStatus.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Today</p>
                <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-gray-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg"
                >
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={fetchTickets}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Support Tickets</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredTickets.map((ticket) => {
                const AgentIcon = AGENT_ICONS[ticket.agent] || HelpCircle;
                return (
                  <div
                    key={ticket.ticketId}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedTicket?.ticketId === ticket.ticketId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AgentIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-mono text-gray-500">{ticket.ticketId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_COLORS[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{ticket.customer.email}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white rounded-lg border border-gray-200">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Ticket Details</h2>
                    <span className="text-xs font-mono text-gray-500">{selectedTicket.ticketId}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{selectedTicket.subject}</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 text-sm rounded-full ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                        {selectedTicket.priority} priority
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[selectedTicket.status]}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm text-gray-500">Customer</label>
                      <p className="font-medium">{selectedTicket.customer.name}</p>
                      <p className="text-sm text-gray-600">{selectedTicket.customer.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">License Key</label>
                      <p className="font-mono text-sm">{selectedTicket.customer.licenseKey}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Assigned Agent</label>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const Icon = AGENT_ICONS[selectedTicket.agent] || HelpCircle;
                          return (
                            <>
                              <Icon className="w-4 h-4 text-gray-500" />
                              <span className="capitalize">{selectedTicket.agent} Agent</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Message</label>
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedTicket.status === 'open' && (
                      <button
                        onClick={() => updateTicketStatus(selectedTicket.ticketId, 'in-progress')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Start Working
                      </button>
                    )}
                    {selectedTicket.status === 'in-progress' && (
                      <button
                        onClick={() => updateTicketStatus(selectedTicket.ticketId, 'resolved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {selectedTicket.status === 'resolved' && (
                      <button
                        onClick={() => updateTicketStatus(selectedTicket.ticketId, 'closed')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
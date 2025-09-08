'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  RocketLaunchIcon,
  EnvelopeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  PlusIcon,
  DocumentTextIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/solid';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  leads: number;
  contacted: number;
  responses: number;
  meetings: number;
  conversionRate: number;
  lastActivity: string;
}

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  status: 'new' | 'contacted' | 'responded' | 'qualified' | 'meeting_scheduled';
  score: number;
  lastContact: string;
}

export default function SalesOutreachPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'leads' | 'settings'>('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeLeads: 0,
    responseRate: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    emailsSent: 0
  });
  const [skills, setSkills] = useState<any[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    checkConfiguration();
    loadDashboardData();
  }, []);

  const checkConfiguration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products/check-keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.configurations?.sales_outreach) {
        setIsConfigured(true);
        loadSalesSkills();
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
    }
  };

  const loadSalesSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/skills/by-category?category=sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error loading sales skills:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load campaigns
      const campaignsResponse = await fetch('/api/sales/campaigns?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        const formattedCampaigns = campaignsData.campaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          leads: c.total_leads,
          contacted: c.leads_contacted,
          responses: c.responses_received,
          meetings: c.meetings_booked,
          conversionRate: c.conversion_rate,
          lastActivity: c.last_activity_at ? formatRelativeTime(c.last_activity_at) : 'No activity'
        }));
        setCampaigns(formattedCampaigns);
        
        // Calculate stats from campaigns
        const totals = campaignsData.campaigns.reduce((acc: any, c: any) => ({
          totalLeads: acc.totalLeads + c.total_leads,
          emailsSent: acc.emailsSent + c.emails_sent,
          responses: acc.responses + c.responses_received,
          meetings: acc.meetings + c.meetings_booked
        }), { totalLeads: 0, emailsSent: 0, responses: 0, meetings: 0 });
        
        setStats({
          totalLeads: totals.totalLeads,
          activeLeads: campaignsData.campaigns.filter((c: any) => c.status === 'active').length * 50,
          responseRate: totals.emailsSent > 0 ? Math.round((totals.responses / totals.emailsSent) * 100) : 0,
          meetingsBooked: totals.meetings,
          conversionRate: totals.totalLeads > 0 ? parseFloat(((totals.meetings / totals.totalLeads) * 100).toFixed(1)) : 0,
          emailsSent: totals.emailsSent
        });
      }
      
      // Load recent leads
      const leadsResponse = await fetch('/api/sales/leads?limit=10&sortBy=created_at', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        const formattedLeads = leadsData.leads.map((l: any) => ({
          id: l.id,
          name: l.full_name || `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
          company: l.company_name || 'Unknown Company',
          email: l.email,
          status: l.status,
          score: l.lead_score,
          lastContact: l.last_email_sent ? formatRelativeTime(l.last_email_sent) : 'Never contacted'
        }));
        setLeads(formattedLeads);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data if API fails
      setCampaigns([]);
      setLeads([]);
      setStats({
        totalLeads: 0,
        activeLeads: 0,
        responseRate: 0,
        meetingsBooked: 0,
        conversionRate: 0,
        emailsSent: 0
      });
      setLoading(false);
    }
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const createNewCampaign = () => {
    router.push('/dashboard/sales-outreach/campaign/new');
  };

  const executeSalesSkill = async (skillId: string, params: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/skills/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          skillId,
          parameters: params,
          context: { product: 'sales_outreach' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Skill executed:', result);
        // Refresh data after skill execution
        loadDashboardData();
        return result;
      }
    } catch (error) {
      console.error('Error executing skill:', error);
    }
  };

  if (!isConfigured) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <RocketLaunchIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sales Outreach Agent Not Configured</h2>
            <p className="text-gray-400 mb-6">
              Set up your Sales Outreach Agent to start generating leads and automating your sales process.
            </p>
            <button
              onClick={() => router.push('/dashboard/products/customize?type=sales_outreach')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Configure Sales Outreach Agent
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <RocketLaunchIcon className="w-10 h-10 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">Sales Outreach Agent</h1>
                <p className="text-blue-100">Automated lead generation and engagement</p>
              </div>
            </div>
            <button
              onClick={createNewCampaign}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
              <span className="text-xs text-green-400">+12%</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalLeads}</p>
            <p className="text-sm text-gray-400">Total Leads</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <SparklesIcon className="w-8 h-8 text-green-500" />
              <span className="text-xs text-green-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeLeads}</p>
            <p className="text-sm text-gray-400">Active Leads</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <EnvelopeIcon className="w-8 h-8 text-purple-500" />
              <span className="text-xs text-green-400">+8%</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.emailsSent}</p>
            <p className="text-sm text-gray-400">Emails Sent</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <ChartBarIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.responseRate}%</p>
            <p className="text-sm text-gray-400">Response Rate</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <PhoneIcon className="w-8 h-8 text-orange-500" />
              <span className="text-xs text-green-400">+5</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.meetingsBooked}</p>
            <p className="text-sm text-gray-400">Meetings</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
            <p className="text-sm text-gray-400">Conversion</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'campaigns'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'leads'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-4 rounded-md transition ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Campaigns</h3>
              <div className="space-y-4">
                {campaigns.filter(c => c.status === 'active').map(campaign => (
                  <div key={campaign.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{campaign.name}</h4>
                        <p className="text-sm text-gray-400">Last activity: {campaign.lastActivity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => executeSalesSkill('email_automation', { campaignId: campaign.id })}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                        >
                          <EnvelopeIcon className="w-5 h-5 text-white" />
                        </button>
                        <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition">
                          <PauseIcon className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Leads</p>
                        <p className="text-white font-semibold">{campaign.leads}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Contacted</p>
                        <p className="text-white font-semibold">{campaign.contacted}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Responses</p>
                        <p className="text-white font-semibold">{campaign.responses}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Meetings</p>
                        <p className="text-white font-semibold">{campaign.meetings}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Conversion Rate</span>
                        <span className="text-white">{campaign.conversionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${campaign.conversionRate * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold text-white mb-4 mt-6">Recent Leads</h3>
              <div className="space-y-3">
                {leads.slice(0, 5).map(lead => (
                  <div key={lead.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-semibold">{lead.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{lead.name}</p>
                        <p className="text-sm text-gray-400">{lead.company} • {lead.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Score</p>
                        <p className="font-semibold text-white">{lead.score}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'qualified' ? 'bg-green-500 text-white' :
                        lead.status === 'responded' ? 'bg-blue-500 text-white' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {lead.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">All Campaigns</h3>
                <button
                  onClick={createNewCampaign}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Create Campaign
                </button>
              </div>
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{campaign.name}</h4>
                      <p className="text-sm text-gray-400">
                        {campaign.leads} leads • {campaign.responses} responses • {campaign.meetings} meetings
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      campaign.status === 'active' ? 'bg-green-500 text-white' :
                      campaign.status === 'paused' ? 'bg-yellow-500 text-black' :
                      campaign.status === 'completed' ? 'bg-blue-500 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Lead Pipeline</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                  Import Leads
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Company</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Last Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-t border-gray-700">
                        <td className="py-3 text-white">{lead.name}</td>
                        <td className="py-3 text-gray-300">{lead.company}</td>
                        <td className="py-3 text-gray-300">{lead.email}</td>
                        <td className="py-3">
                          <span className="text-white font-semibold">{lead.score}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            lead.status === 'qualified' ? 'bg-green-500 text-white' :
                            lead.status === 'responded' ? 'bg-blue-500 text-white' :
                            'bg-gray-600 text-gray-300'
                          }`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{lead.lastContact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sales Outreach Settings</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Email Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Sending Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="sales@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Daily Send Limit</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        placeholder="50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">CRM Integration</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-gray-800 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      Connect Salesforce
                    </button>
                    <button className="w-full bg-gray-800 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition flex items-center justify-center">
                      <GlobeAltIcon className="w-5 h-5 mr-2" />
                      Connect HubSpot
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Enabled Skills</h4>
                  <div className="space-y-2">
                    {skills.length > 0 ? (
                      skills.map((skill: any) => (
                        <div key={skill.id} className="flex items-center justify-between py-2">
                          <span className="text-gray-300">{skill.name}</span>
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">Loading skills...</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/products/customize?type=sales_outreach')}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Manage Skills
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
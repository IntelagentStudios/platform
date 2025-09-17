'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Mail,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Reply,
  Eye,
  EyeOff,
  MessageSquare,
  User,
  Calendar,
  Building,
  Briefcase,
  Star,
  Archive,
  Trash2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  leadCompany: string;
  leadRole: string;
  campaignName: string;
  status: 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced';
  lastActivity: string;
  messages: Message[];
  score: number;
  tags: string[];
}

interface Message {
  id: string;
  type: 'outbound' | 'inbound';
  subject: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied';
  opens?: number;
  clicks?: number;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [filterStatus, filterCampaign]);

  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        campaign: filterCampaign,
        search: searchQuery
      });

      const response = await fetch(`/api/sales/conversations?${params}`);
      const data = await response.json();

      // Mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: '1',
          leadId: 'lead-1',
          leadName: 'Sarah Chen',
          leadEmail: 'sarah.chen@techflow.com',
          leadCompany: 'TechFlow Solutions',
          leadRole: 'CTO',
          campaignName: 'Q1 Enterprise Outreach',
          status: 'replied',
          lastActivity: '2 hours ago',
          score: 85,
          tags: ['hot-lead', 'enterprise'],
          messages: [
            {
              id: 'msg-1',
              type: 'outbound',
              subject: 'Scaling your DevOps pipeline at TechFlow',
              body: `Hi Sarah,

I noticed TechFlow just raised $25M in Series B funding - congratulations! With this growth, I imagine you're looking at scaling your engineering infrastructure.

We help CTOs at fast-growing companies like yours automate their DevOps pipelines, reducing deployment time by 70% on average.

Would you be open to a 15-minute call next week to explore how we could help TechFlow scale more efficiently?

Best regards,
John`,
              timestamp: '2024-01-15T10:00:00Z',
              status: 'opened',
              opens: 3,
              clicks: 1
            },
            {
              id: 'msg-2',
              type: 'inbound',
              subject: 'Re: Scaling your DevOps pipeline at TechFlow',
              body: `Hi John,

Thanks for reaching out. We're actually evaluating DevOps solutions right now.

Could you share more details about your platform's capabilities, especially around Kubernetes orchestration and multi-cloud deployments?

Also, do you have any case studies from similar B2B SaaS companies?

Best,
Sarah`,
              timestamp: '2024-01-15T14:30:00Z',
              status: 'replied'
            }
          ]
        },
        {
          id: '2',
          leadId: 'lead-2',
          leadName: 'Michael Rodriguez',
          leadEmail: 'michael@datasync.io',
          leadCompany: 'DataSync Inc',
          leadRole: 'VP of Engineering',
          campaignName: 'Q1 Enterprise Outreach',
          status: 'opened',
          lastActivity: '5 hours ago',
          score: 65,
          tags: ['warm-lead'],
          messages: [
            {
              id: 'msg-3',
              type: 'outbound',
              subject: "Quick question about DataSync's data pipeline",
              body: `Hi Michael,

I saw that DataSync launched a new real-time sync platform - impressive work!

We specialize in helping engineering teams like yours optimize data pipeline performance. Our clients typically see 3x improvement in processing speed.

Worth a quick chat to explore if we could help DataSync handle even larger data volumes?

Best,
John`,
              timestamp: '2024-01-15T09:00:00Z',
              status: 'opened',
              opens: 5,
              clicks: 0
            }
          ]
        },
        {
          id: '3',
          leadId: 'lead-3',
          leadName: 'Emma Thompson',
          leadEmail: 'emma.t@cloudfirst.com',
          leadCompany: 'CloudFirst Systems',
          leadRole: 'Head of Product',
          campaignName: 'Product Leader Campaign',
          status: 'sent',
          lastActivity: '1 day ago',
          score: 45,
          tags: ['follow-up-needed'],
          messages: [
            {
              id: 'msg-4',
              type: 'outbound',
              subject: "Congrats on CloudFirst's European expansion",
              body: `Hi Emma,

Congratulations on CloudFirst\'s expansion to Europe! Managing products across multiple regions brings unique challenges.

We help product teams streamline their multi-region deployments and feature rollouts. Would love to share how we've helped similar companies.

Open to a brief call next week?

Best,
John`,
              timestamp: '2024-01-14T11:00:00Z',
              status: 'sent'
            }
          ]
        }
      ];

      setConversations(mockConversations);
      if (mockConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyMessage.trim()) return;

    try {
      const response = await fetch('/api/sales/conversations/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          leadId: selectedConversation.leadId,
          message: replyMessage
        })
      });

      if (response.ok) {
        // Refresh conversation
        fetchConversations();
        setReplyMessage('');
        setShowReplyDialog(false);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-blue-100 text-blue-800';
      case 'clicked': return 'bg-purple-100 text-purple-800';
      case 'sent': return 'bg-gray-100 text-gray-800';
      case 'bounced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sales">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Conversations</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your email conversations
            </p>
          </div>
          <Button onClick={() => fetchConversations()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="q1-enterprise">Q1 Enterprise Outreach</SelectItem>
                <SelectItem value="product-leader">Product Leader Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-300px)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Inbox</CardTitle>
            </CardHeader>
            <ScrollArea className="h-full">
              <CardContent className="p-0">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {conversation.leadName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{conversation.leadName}</p>
                          <p className="text-xs text-muted-foreground">{conversation.leadCompany}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </Badge>
                    </div>
                    <p className="text-sm truncate mb-1">
                      {conversation.messages[conversation.messages.length - 1]?.subject}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{conversation.lastActivity}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${getScoreColor(conversation.score)}`}>
                          {conversation.score}%
                        </span>
                        {conversation.messages.some(m => m.type === 'inbound') && (
                          <MessageSquare className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[calc(100vh-300px)]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConversation.leadName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedConversation.leadName}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {selectedConversation.leadRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {selectedConversation.leadCompany}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedConversation.leadEmail}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowReplyDialog(true)}
                    >
                      <Reply className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                    <Button size="sm" variant="outline">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 h-[calc(100%-120px)]">
                <CardContent className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.type === 'outbound' ? 'bg-muted/50' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.type === 'outbound' ? 'outline' : 'default'}>
                            {message.type === 'outbound' ? 'Sent' : 'Received'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {message.type === 'outbound' && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {message.opens && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {message.opens} opens
                              </span>
                            )}
                            {message.clicks && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {message.clicks} clicks
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="font-medium mb-2">{message.subject}</p>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.body}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-300px)] flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Select a conversation to view</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedConversation?.leadName}</DialogTitle>
            <DialogDescription>
              Send a personalized response to continue the conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply}>
              <Send className="mr-2 h-4 w-4" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
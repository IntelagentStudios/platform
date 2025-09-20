'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Upload,
  Download,
  Filter,
  MoreHorizontal,
  Mail,
  User,
  Building,
  MapPin,
  Phone,
  Globe,
  Linkedin,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Send,
  UserPlus,
  Target,
  Tag,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  FileText,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
  company_domain: string;
  job_title: string;
  phone: string;
  linkedin_url: string;
  city: string;
  state: string;
  country: string;
  status: string;
  score: number;
  tags: string[];
  emails_sent: number;
  emails_opened: number;
  last_contacted_at: string;
  created_at: string;
  campaign?: {
    id: string;
    name: string;
  };
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const leadsPerPage = 20;

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, filterStatus, sortBy, sortOrder, currentPage]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        status: filterStatus,
        sortBy,
        sortOrder,
        limit: leadsPerPage.toString(),
        offset: ((currentPage - 1) * leadsPerPage).toString()
      });

      const response = await fetch(`/api/sales/leads?${params}`);
      const data = await response.json();

      setLeads(data.leads || []);
      setTotalLeads(data.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive'
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
    setShowBulkActions(checked);
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
    setShowBulkActions(selectedLeads.length > 0);
  };

  const handleScoreLead = async (leadId: string) => {
    try {
      const response = await fetch('/api/sales/leads/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Lead scored successfully'
        });
        fetchLeads();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to score lead',
        variant: 'destructive'
      });
    }
  };

  const handleQualifyLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'qualified' })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Lead qualified successfully'
        });
        fetchLeads();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to qualify lead',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const response = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Lead deleted successfully'
        });
        fetchLeads();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive'
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedLeads.length === 0) return;

    try {
      const response = await fetch('/api/sales/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          leadIds: selectedLeads
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Bulk ${action} completed`
        });
        setSelectedLeads([]);
        setShowBulkActions(false);
        fetchLeads();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} leads`,
        variant: 'destructive'
      });
    }
  };

  const handleExportLeads = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        status: filterStatus
      });

      const response = await fetch(`/api/sales/leads/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export leads',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'qualified': return 'default';
      case 'contacted': return 'outline';
      case 'meeting_scheduled': return 'default';
      case 'opportunity': return 'default';
      case 'unqualified': return 'destructive';
      case 'lost': return 'destructive';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground mt-1">
            {totalLeads} total leads in your database
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportLeads}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/sales/leads/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Enter the lead's information to add them to your database
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" placeholder="Acme Corp" />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" placeholder="CEO" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1 234 567 8900" />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input id="linkedin" placeholder="linkedin.com/in/johndoe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Additional information..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Added</SelectItem>
                <SelectItem value="score">Lead Score</SelectItem>
                <SelectItem value="last_contacted_at">Last Contacted</SelectItem>
                <SelectItem value="company_name">Company</SelectItem>
                <SelectItem value="full_name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchLeads}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="flex gap-2 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedLeads.length} selected
              </span>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('qualify')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Qualify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('addToCampaign')}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Add to Campaign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('tag')}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div
                        className="cursor-pointer hover:text-primary"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDetails(true);
                        }}
                      >
                        <div className="font-medium">{lead.full_name || `${lead.first_name} ${lead.last_name}`}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                        {lead.job_title && (
                          <div className="text-xs text-muted-foreground">{lead.job_title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {lead.company_name && (
                          <div className="font-medium">{lead.company_name}</div>
                        )}
                        {lead.city && lead.country && (
                          <div className="text-xs text-muted-foreground">
                            {lead.city}, {lead.country}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleScoreLead(lead.id)}
                        >
                          <TrendingUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lead.status)}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{lead.emails_sent || 0} sent</span>
                        </div>
                        {lead.emails_opened > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {lead.emails_opened} opened
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.last_contacted_at ? (
                        <div className="text-sm">
                          {new Date(lead.last_contacted_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.campaign ? (
                        <Link href={`/dashboard/sales/campaigns/${lead.campaign.id}`}>
                          <Badge variant="outline" className="cursor-pointer">
                            {lead.campaign.name}
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedLead(lead);
                            setShowDetails(true);
                          }}>
                            <User className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Meeting
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQualifyLead(lead.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Qualify Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Target className="mr-2 h-4 w-4" />
                            Add to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          {totalLeads > leadsPerPage && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * leadsPerPage) + 1} to{' '}
                {Math.min(currentPage * leadsPerPage, totalLeads)} of {totalLeads} leads
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage * leadsPerPage >= totalLeads}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedLead.full_name}</DialogTitle>
                <DialogDescription>{selectedLead.email}</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="info" className="mt-4">
                <TabsList>
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company</Label>
                      <p className="text-sm">{selectedLead.company_name || '-'}</p>
                    </div>
                    <div>
                      <Label>Job Title</Label>
                      <p className="text-sm">{selectedLead.job_title || '-'}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm">{selectedLead.phone || '-'}</p>
                    </div>
                    <div>
                      <Label>LinkedIn</Label>
                      {selectedLead.linkedin_url ? (
                        <a href={selectedLead.linkedin_url} target="_blank" className="text-sm text-primary">
                          View Profile
                        </a>
                      ) : (
                        <p className="text-sm">-</p>
                      )}
                    </div>
                    <div>
                      <Label>Location</Label>
                      <p className="text-sm">
                        {[selectedLead.city, selectedLead.state, selectedLead.country]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </p>
                    </div>
                    <div>
                      <Label>Lead Score</Label>
                      <p className={`text-sm font-bold ${getScoreColor(selectedLead.score)}`}>
                        {selectedLead.score}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activity">
                  <p className="text-sm text-muted-foreground">Activity timeline coming soon...</p>
                </TabsContent>
                <TabsContent value="notes">
                  <Textarea placeholder="Add notes about this lead..." rows={5} />
                </TabsContent>
              </Tabs>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}

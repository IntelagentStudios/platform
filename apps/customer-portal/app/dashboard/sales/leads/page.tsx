'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  User,
  Building,
  MapPin,
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Eye,
  Target,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  companyName: string;
  jobTitle: string;
  status: string;
  score: number;
  emailsSent: number;
  emailsOpened: number;
  lastContacted: string;
  createdAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showEnrichDialog, setShowEnrichDialog] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [currentPage, filterStatus]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        status: filterStatus,
        search: searchQuery
      });

      const response = await fetch(`/api/sales/leads?${params}`);
      const data = await response.json();

      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
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
        fetchLeads();
        setSelectedLeads([]);
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'contacted': return 'secondary';
      case 'engaged': return 'outline';
      case 'qualified': return 'default';
      case 'converted': return 'default';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
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
            <h1 className="text-3xl font-bold">Leads Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your sales leads
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/sales/leads/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Link href="/dashboard/sales/leads/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedLeads.length} leads selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('add_to_campaign')}>
                  Add to Campaign
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowEnrichDialog(true)}>
                  <Target className="mr-2 h-4 w-4" />
                  Enrich
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">No leads found</p>
                        <p className="text-sm text-muted-foreground">
                          Import leads or add them manually to get started
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/dashboard/sales/leads/import">
                          <Button size="sm">Import Leads</Button>
                        </Link>
                        <Link href="/dashboard/sales/leads/new">
                          <Button size="sm" variant="outline">Add Manually</Button>
                        </Link>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.fullName}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead.companyName}</p>
                        <p className="text-sm text-muted-foreground">{lead.jobTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{lead.emailsSent} sent</p>
                        <p className="text-muted-foreground">{lead.emailsOpened} opened</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : 'Never'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Target className="mr-2 h-4 w-4" />
                            Enrich Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Enrich Dialog */}
      <Dialog open={showEnrichDialog} onOpenChange={setShowEnrichDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrich Lead Data</DialogTitle>
            <DialogDescription>
              Enhance your lead data with additional information from external sources
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enrichment Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Company Information</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Social Profiles</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Contact Details</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox />
                  <span className="text-sm">Technology Stack</span>
                </label>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>{selectedLeads.length} leads</strong> will be enriched.
                This will use {selectedLeads.length * 2} credits.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEnrichDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                handleBulkAction('enrich');
                setShowEnrichDialog(false);
              }}>
                Start Enrichment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
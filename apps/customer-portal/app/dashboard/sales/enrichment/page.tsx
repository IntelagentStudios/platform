'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Upload, Download, Sparkles, Building2, User, Mail, Phone, Globe, Linkedin, Twitter, MapPin, Briefcase, TrendingUp, Users } from 'lucide-react';

export default function EnrichmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [bulkInput, setBulkInput] = useState('');

  const handleEnrichSingle = async () => {
    if (!searchQuery) {
      toast.error('Please enter a company name or domain');
      return;
    }

    setIsEnriching(true);
    // Simulate enrichment process
    setTimeout(() => {
      setEnrichedData({
        company: {
          name: 'Acme Corporation',
          domain: 'acme.com',
          industry: 'Software Development',
          size: '500-1000 employees',
          location: 'San Francisco, CA',
          founded: '2015',
          revenue: '$50M - $100M',
          description: 'Leading provider of cloud-based business solutions',
          technologies: ['React', 'Node.js', 'AWS', 'PostgreSQL'],
          socialProfiles: {
            linkedin: 'linkedin.com/company/acme',
            twitter: '@acmecorp'
          }
        },
        contacts: [
          {
            name: 'John Smith',
            title: 'VP of Sales',
            email: 'john.smith@acme.com',
            phone: '+1 (555) 123-4567',
            linkedin: 'linkedin.com/in/johnsmith'
          },
          {
            name: 'Sarah Johnson',
            title: 'Director of Marketing',
            email: 'sarah.johnson@acme.com',
            linkedin: 'linkedin.com/in/sarahjohnson'
          }
        ],
        insights: [
          'Recently raised $25M Series B funding',
          'Expanding sales team by 30% this quarter',
          'Launched new product line targeting enterprise clients',
          'Opening new office in Austin, TX'
        ]
      });
      setIsEnriching(false);
      toast.success('Company data enriched successfully');
    }, 2000);
  };

  const handleBulkEnrich = () => {
    if (!bulkInput) {
      toast.error('Please add companies to enrich');
      return;
    }

    const companies = bulkInput.split('\n').filter(c => c.trim());
    toast.info(`Enriching ${companies.length} companies...`);
    // In production, this would process the bulk list
  };

  const handleExport = () => {
    toast.success('Data exported to CSV');
  };

  return (
    <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Data Enrichment</h1>
          <p className="text-gray-400">Enhance your prospect data with AI-powered insights</p>
        </div>

        {/* Search Section */}
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Single Company Enrichment</h2>
          </div>

          <div className="flex gap-4">
            <Input
              placeholder="Enter company name or domain (e.g., acme.com)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-700 border-gray-600 text-white"
            />
            <Button
              onClick={handleEnrichSingle}
              disabled={isEnriching}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isEnriching ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                  Enriching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Enrich Data
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Enriched Data Display */}
        {enrichedData && (
          <div className="space-y-6 mb-8">
            {/* Company Information */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-purple-500" />
                  <h3 className="text-xl font-semibold text-white">{enrichedData.company.name}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Industry</p>
                  <p className="text-white">{enrichedData.company.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Company Size</p>
                  <p className="text-white">{enrichedData.company.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Location</p>
                  <p className="text-white flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {enrichedData.company.location}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Revenue</p>
                  <p className="text-white">{enrichedData.company.revenue}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 mb-1">Description</p>
                  <p className="text-white">{enrichedData.company.description}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {enrichedData.company.technologies.map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="bg-purple-500/20 text-purple-300">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Contacts */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-semibold text-white">Key Contacts</h3>
              </div>

              <div className="space-y-4">
                {enrichedData.contacts.map((contact: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-lg">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <User className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{contact.name}</p>
                      <p className="text-sm text-gray-400 mb-2">{contact.title}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.linkedin && (
                          <a href={`https://${contact.linkedin}`} className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Add to Campaign
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Business Insights */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                <h3 className="text-xl font-semibold text-white">Business Insights</h3>
              </div>

              <ul className="space-y-2">
                {enrichedData.insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Bulk Enrichment */}
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Upload className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Bulk Enrichment</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-companies">Company List</Label>
              <Textarea
                id="bulk-companies"
                placeholder="Enter company names or domains (one per line)&#10;acme.com&#10;techcorp.io&#10;innovate-solutions.com"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="border-gray-600 hover:bg-gray-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <Button
                onClick={handleBulkEnrich}
                disabled={!bulkInput}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Enrich All
              </Button>
            </div>

            <p className="text-sm text-gray-400">
              Bulk enrichment credits: <span className="text-white font-semibold">1,000</span> remaining this month
            </p>
          </div>
        </Card>
    </div>
  );
}
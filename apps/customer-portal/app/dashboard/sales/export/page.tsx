'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { SalesLayout } from '../layout-client';
import { Download, FileText, Table, Database, Calendar, Filter, Clock, Check, FileSpreadsheet, FileJson } from 'lucide-react';

export default function ExportPage() {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedDateRange, setSelectedDateRange] = useState('last_30_days');
  const [selectedData, setSelectedData] = useState({
    prospects: true,
    campaigns: true,
    emails: false,
    analytics: false
  });

  const exportHistory = [
    {
      id: 1,
      date: '2024-01-15',
      type: 'Full Export',
      format: 'CSV',
      size: '2.4 MB',
      records: 1250
    },
    {
      id: 2,
      date: '2024-01-10',
      type: 'Prospects Only',
      format: 'Excel',
      size: '1.1 MB',
      records: 650
    },
    {
      id: 3,
      date: '2024-01-05',
      type: 'Campaign Results',
      format: 'JSON',
      size: '450 KB',
      records: 320
    }
  ];

  const handleExport = () => {
    const selectedTypes = Object.entries(selectedData)
      .filter(([_, selected]) => selected)
      .map(([type]) => type);

    if (selectedTypes.length === 0) {
      toast.error('Please select at least one data type to export');
      return;
    }

    toast.success(`Exporting ${selectedTypes.join(', ')} as ${selectedFormat.toUpperCase()}`);
    // In production, this would trigger actual export
  };

  const formatIcons = {
    csv: FileSpreadsheet,
    excel: FileSpreadsheet,
    json: FileJson,
    pdf: FileText
  };

  return (
    <SalesLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Export Data</h1>
          <p className="text-gray-400">Download your sales data in various formats</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Selection */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-white">Select Data to Export</h2>
              </div>

              <div className="space-y-4">
                {Object.entries({
                  prospects: {
                    label: 'Prospects',
                    description: 'All prospect information including enriched data',
                    count: '1,234 records'
                  },
                  campaigns: {
                    label: 'Campaigns',
                    description: 'Campaign configurations and templates',
                    count: '12 campaigns'
                  },
                  emails: {
                    label: 'Email History',
                    description: 'Sent emails and engagement metrics',
                    count: '5,678 emails'
                  },
                  analytics: {
                    label: 'Analytics',
                    description: 'Performance metrics and conversion data',
                    count: 'Last 30 days'
                  }
                }).map(([key, data]) => (
                  <div key={key} className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                    <Checkbox
                      id={key}
                      checked={selectedData[key as keyof typeof selectedData]}
                      onCheckedChange={(checked) =>
                        setSelectedData(prev => ({ ...prev, [key]: checked }))
                      }
                      className="mt-1"
                    />
                    <label htmlFor={key} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{data.label}</p>
                          <p className="text-sm text-gray-400">{data.description}</p>
                        </div>
                        <span className="text-sm text-purple-400">{data.count}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Export Options */}
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Filter className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-white">Export Options</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="format">File Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger id="format" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                      <SelectItem value="pdf">PDF Report (.pdf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                    <SelectTrigger id="date-range" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="all_time">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-purple-300">
                  <strong>Estimated Export Size:</strong> ~3.2 MB
                </p>
                <p className="text-sm text-purple-300 mt-1">
                  <strong>Estimated Records:</strong> ~2,150 total records
                </p>
              </div>

              <Button
                onClick={handleExport}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Export Data
              </Button>
            </Card>
          </div>

          {/* Export History */}
          <div>
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-white">Export History</h2>
              </div>

              <div className="space-y-4">
                {exportHistory.map(export_ => {
                  const Icon = formatIcons[export_.format.toLowerCase() as keyof typeof formatIcons] || FileText;

                  return (
                    <div key={export_.id} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded">
                          <Icon className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-sm">{export_.type}</p>
                          <p className="text-xs text-gray-400 mt-1">{export_.date}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-gray-400">{export_.format}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{export_.size}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{export_.records} records</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 border-gray-600 hover:bg-gray-700"
                size="sm"
              >
                View All Exports
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800/50 border-gray-700 p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Export</h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 hover:bg-gray-700"
                  onClick={() => {
                    setSelectedData({ prospects: true, campaigns: false, emails: false, analytics: false });
                    setSelectedFormat('csv');
                    handleExport();
                  }}
                >
                  <Table className="mr-2 h-4 w-4" />
                  Export All Prospects
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 hover:bg-gray-700"
                  onClick={() => {
                    setSelectedData({ prospects: false, campaigns: true, emails: true, analytics: false });
                    setSelectedFormat('excel');
                    handleExport();
                  }}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Campaign Report
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-600 hover:bg-gray-700"
                  onClick={() => {
                    setSelectedData({ prospects: false, campaigns: false, emails: false, analytics: true });
                    setSelectedFormat('pdf');
                    handleExport();
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Analytics Report
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SalesLayout>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Upload, 
  Settings, 
  CheckCircle,
  Download,
  FileSpreadsheet,
  Zap,
  AlertCircle,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SalesAgentSetupProps {
  licenseKey: string;
  onComplete?: () => void;
}

export function SalesAgentSetup({ licenseKey, onComplete }: SalesAgentSetupProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [enableFollowUp, setEnableFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState('3');
  const [setupStep, setSetupStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const sampleCsvContent = `name,email,company,phone,notes
John Doe,john@example.com,Acme Corp,555-0123,Interested in enterprise plan
Jane Smith,jane@example.com,Tech Co,555-0124,Needs demo scheduled`;

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file',
          variant: 'destructive'
        });
        return;
      }
      setCsvFile(file);
    }
  };

  const handleUploadLeads = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch('/api/products/sales-agent/upload-leads', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSetupStep(1);
        toast({
          title: 'Leads uploaded',
          description: `Successfully imported ${data.count} leads`
        });
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload leads file',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      const response = await fetch('/api/products/sales-agent/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailTemplate,
          enableFollowUp,
          followUpDays: parseInt(followUpDays)
        })
      });

      if (response.ok) {
        setSetupStep(2);
        toast({
          title: 'Configuration saved',
          description: 'Your sales agent is ready to start'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive'
      });
    }
  };

  const handleStartCampaign = async () => {
    try {
      const response = await fetch('/api/products/sales-agent/start-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast({
          title: 'Campaign started!',
          description: 'Your sales agent is now processing leads'
        });
        if (onComplete) onComplete();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {['Upload Leads', 'Configure Outreach', 'Launch Campaign'].map((label, idx) => (
          <div
            key={idx}
            className={`flex items-center ${idx < 2 ? 'flex-1' : ''}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${setupStep >= idx 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'}
                `}
              >
                {setupStep > idx ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </div>
            {idx < 2 && (
              <div
                className={`
                  flex-1 h-1 mx-2 -mt-4
                  ${setupStep > idx ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload Leads */}
      {setupStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Lead List</CardTitle>
            <CardDescription>
              Import your contacts as a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">
                    Click to upload
                  </span>
                  {' or drag and drop'}
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground">
                  CSV files only (max 10MB)
                </p>
              </div>
            </div>

            {csvFile && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={downloadSampleCsv}>
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button 
                onClick={handleUploadLeads}
                disabled={!csvFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Leads'}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Required columns: name, email. Optional: company, phone, notes
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure Outreach */}
      {setupStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Outreach Settings</CardTitle>
            <CardDescription>
              Customize how your sales agent contacts leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Textarea
                id="template"
                placeholder="Hi {name}, I noticed you're interested in..."
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={6}
              />
              <p className="text-sm text-muted-foreground">
                Use {'{name}'}, {'{company}'}, {'{email}'} as variables
              </p>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Follow-ups</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send follow-up emails
                  </p>
                </div>
                <Switch
                  checked={enableFollowUp}
                  onCheckedChange={setEnableFollowUp}
                />
              </div>

              {enableFollowUp && (
                <div className="space-y-2">
                  <Label htmlFor="followup">Follow-up After (days)</Label>
                  <Input
                    id="followup"
                    type="number"
                    min="1"
                    max="30"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setSetupStep(0)}>
                Back
              </Button>
              <Button onClick={handleSaveConfiguration}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Launch Campaign */}
      {setupStep === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ready to Launch!</CardTitle>
              <CardDescription>
                Review your campaign settings before starting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Leads</span>
                  <Badge variant="secondary">150 contacts</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Email Template</span>
                  <Badge variant="secondary">Configured</Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Follow-ups</span>
                  <Badge variant="secondary">
                    {enableFollowUp ? `After ${followUpDays} days` : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Estimated Completion</span>
                  <Badge variant="secondary">24-48 hours</Badge>
                </div>
              </div>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Your sales agent will start contacting leads immediately after launch
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setSetupStep(1)}>
                  Back
                </Button>
                <Button onClick={handleStartCampaign} className="bg-green-600 hover:bg-green-700">
                  <Zap className="h-4 w-4 mr-2" />
                  Launch Campaign
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Personalized Outreach</p>
                  <p className="text-sm text-muted-foreground">
                    Each lead receives a customized email
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Smart Scheduling</p>
                  <p className="text-sm text-muted-foreground">
                    Emails sent at optimal times for engagement
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Response Tracking</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor opens, clicks, and replies in real-time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
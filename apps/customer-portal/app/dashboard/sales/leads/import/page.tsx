'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Users,
  Mail,
  Building,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  csvField: string;
  systemField: string;
  required: boolean;
}

const SYSTEM_FIELDS = [
  { value: 'email', label: 'Email', icon: Mail, required: true },
  { value: 'firstName', label: 'First Name', icon: Users, required: false },
  { value: 'lastName', label: 'Last Name', icon: Users, required: false },
  { value: 'fullName', label: 'Full Name', icon: Users, required: false },
  { value: 'companyName', label: 'Company', icon: Building, required: false },
  { value: 'companyDomain', label: 'Company Domain', icon: Globe, required: false },
  { value: 'jobTitle', label: 'Job Title', icon: Briefcase, required: false },
  { value: 'department', label: 'Department', icon: Hash, required: false },
  { value: 'phone', label: 'Phone', icon: Phone, required: false },
  { value: 'linkedinUrl', label: 'LinkedIn URL', icon: Globe, required: false },
  { value: 'city', label: 'City', icon: MapPin, required: false },
  { value: 'state', label: 'State', icon: MapPin, required: false },
  { value: 'country', label: 'Country', icon: MapPin, required: false },
  { value: 'industry', label: 'Industry', icon: Building, required: false },
  { value: 'companySize', label: 'Company Size', icon: Building, required: false },
  { value: 'tags', label: 'Tags', icon: Hash, required: false }
];

export default function ImportLeadsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [campaign, setCampaign] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);

      // Parse CSV
      Papa.parse(uploadedFile, {
        complete: (result) => {
          if (result.data && result.data.length > 0) {
            const headers = Object.keys(result.data[0] as any);
            setCsvHeaders(headers);
            setCsvData(result.data as CSVRow[]);

            // Auto-map fields based on common naming patterns
            const autoMappings: FieldMapping[] = headers.map(header => {
              const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

              // Try to auto-detect field mappings
              let systemField = '';
              if (lowerHeader.includes('email')) systemField = 'email';
              else if (lowerHeader.includes('firstname') || lowerHeader === 'fname') systemField = 'firstName';
              else if (lowerHeader.includes('lastname') || lowerHeader === 'lname') systemField = 'lastName';
              else if (lowerHeader.includes('fullname') || lowerHeader === 'name') systemField = 'fullName';
              else if (lowerHeader.includes('company') && !lowerHeader.includes('size')) systemField = 'companyName';
              else if (lowerHeader.includes('domain') || lowerHeader.includes('website')) systemField = 'companyDomain';
              else if (lowerHeader.includes('title') || lowerHeader.includes('position')) systemField = 'jobTitle';
              else if (lowerHeader.includes('department') || lowerHeader.includes('dept')) systemField = 'department';
              else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) systemField = 'phone';
              else if (lowerHeader.includes('linkedin')) systemField = 'linkedinUrl';
              else if (lowerHeader.includes('city')) systemField = 'city';
              else if (lowerHeader.includes('state')) systemField = 'state';
              else if (lowerHeader.includes('country')) systemField = 'country';
              else if (lowerHeader.includes('industry')) systemField = 'industry';
              else if (lowerHeader.includes('size') || lowerHeader.includes('employees')) systemField = 'companySize';
              else if (lowerHeader.includes('tag')) systemField = 'tags';

              return {
                csvField: header,
                systemField,
                required: systemField === 'email'
              };
            });

            setFieldMappings(autoMappings);
            setStep(2);
          }
        },
        header: true,
        skipEmptyLines: true
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const updateFieldMapping = (csvField: string, systemField: string) => {
    setFieldMappings(prev =>
      prev.map(mapping =>
        mapping.csvField === csvField
          ? { ...mapping, systemField }
          : mapping
      )
    );
  };

  const validateMappings = () => {
    const errors: string[] = [];

    // Check if email field is mapped
    const emailMapping = fieldMappings.find(m => m.systemField === 'email');
    if (!emailMapping) {
      errors.push('Email field is required');
    }

    // Check for duplicate mappings
    const systemFields = fieldMappings.filter(m => m.systemField).map(m => m.systemField);
    const duplicates = systemFields.filter((field, index) => systemFields.indexOf(field) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate mappings: ${[...new Set(duplicates)].join(', ')}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const importLeads = async () => {
    if (!validateMappings()) return;

    setImporting(true);
    setImportProgress(0);

    const batchSize = 50;
    const batches = [];

    // Prepare data for import
    const mappedData = csvData.map(row => {
      const lead: any = { source: 'csv_import' };
      if (campaign) lead.campaignId = campaign;

      fieldMappings.forEach(mapping => {
        if (mapping.systemField && row[mapping.csvField]) {
          if (mapping.systemField === 'tags') {
            lead[mapping.systemField] = row[mapping.csvField].split(',').map(t => t.trim());
          } else {
            lead[mapping.systemField] = row[mapping.csvField];
          }
        }
      });

      return lead;
    });

    // Split into batches
    for (let i = 0; i < mappedData.length; i += batchSize) {
      batches.push(mappedData.slice(i, i + batchSize));
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process batches
    for (let i = 0; i < batches.length; i++) {
      try {
        const response = await fetch('/api/sales/leads/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'import',
            leads: batches[i]
          })
        });

        const result = await response.json();

        if (response.ok) {
          successCount += result.success || batches[i].length;
          failedCount += result.failed || 0;
          if (result.errors) errors.push(...result.errors);
        } else {
          failedCount += batches[i].length;
          errors.push(result.error || 'Import failed');
        }

        setImportProgress(((i + 1) / batches.length) * 100);
      } catch (error) {
        failedCount += batches[i].length;
        errors.push(`Batch ${i + 1} failed: ${error}`);
      }
    }

    setImportResult({
      success: successCount,
      failed: failedCount,
      errors
    });

    setImporting(false);
    setStep(4);
  };

  const downloadTemplate = () => {
    const template = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Example Corp',
        jobTitle: 'Marketing Manager',
        phone: '+1-234-567-8900',
        city: 'New York',
        country: 'USA'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sales/leads">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Button>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Import Leads</h1>
            <p className="text-muted-foreground mt-1">
              Upload a CSV file to bulk import leads
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Map Fields' },
            { num: 3, label: 'Review' },
            { num: 4, label: 'Complete' }
          ].map((s, index) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s.num ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  s.num
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= s.num ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
              {index < 3 && (
                <div className={`w-24 h-0.5 mx-4 ${
                  step > s.num ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing your lead data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <Button variant="outline">Select File</Button>
                </>
              )}
            </div>

            {file && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {(file.size / 1024).toFixed(2)} KB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setCsvData([]);
                    setCsvHeaders([]);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Field Mapping */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map CSV Fields</CardTitle>
            <CardDescription>
              Match your CSV columns to lead fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We've automatically detected some field mappings. Please review and adjust as needed.
                  Email field is required.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {fieldMappings.map((mapping) => (
                  <div key={mapping.csvField} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">CSV Column</Label>
                      <div className="flex items-center mt-1">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium">{mapping.csvField}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Label className="text-sm text-muted-foreground">Lead Field</Label>
                      <Select
                        value={mapping.systemField}
                        onValueChange={(value) => updateFieldMapping(mapping.csvField, value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this field</SelectItem>
                          {SYSTEM_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              <div className="flex items-center">
                                <field.icon className="h-4 w-4 mr-2" />
                                {field.label}
                                {field.required && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Label>Add to Campaign (Optional)</Label>
                <Select value={campaign} onValueChange={setCampaign}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a campaign..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No campaign</SelectItem>
                    <SelectItem value="welcome">Welcome Campaign</SelectItem>
                    <SelectItem value="nurture">Nurture Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationErrors.map((error, i) => (
                    <div key={i}>{error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => {
                  if (validateMappings()) {
                    setStep(3);
                  }
                }}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Import</CardTitle>
            <CardDescription>
              Preview the first few rows of your import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{csvData.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Fields Mapped</p>
                  <p className="text-2xl font-bold">
                    {fieldMappings.filter(m => m.systemField).length}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fieldMappings
                        .filter(m => m.systemField)
                        .map((mapping) => (
                          <TableHead key={mapping.systemField}>
                            {SYSTEM_FIELDS.find(f => f.value === mapping.systemField)?.label}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {fieldMappings
                          .filter(m => m.systemField)
                          .map((mapping) => (
                            <TableCell key={mapping.systemField}>
                              {row[mapping.csvField] || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {csvData.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 5 of {csvData.length} leads
                </p>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                disabled={importing}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={importLeads}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Start Import
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {importing && (
              <div className="mt-4">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {Math.round(importProgress)}% complete
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              Your leads have been imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-900">Successfully Imported</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {importResult.success}
                  </p>
                </div>
                {importResult.failed > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-900">Failed</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {importResult.failed}
                    </p>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Import errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {importResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                    {importResult.errors.length > 5 && (
                      <p className="text-sm mt-2">
                        And {importResult.errors.length - 5} more errors...
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-3 pt-4">
                <Link href="/dashboard/sales/leads">
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    View Leads
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setFile(null);
                    setCsvData([]);
                    setCsvHeaders([]);
                    setFieldMappings([]);
                    setImportResult(null);
                  }}
                >
                  Import More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
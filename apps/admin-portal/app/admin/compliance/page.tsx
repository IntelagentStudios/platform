'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react'

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/security/compliance')
      if (response.ok) {
        const data = await response.json()
        setComplianceData(data)
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Mock data if API is not available
  const mockCompliance = {
    overall: 85,
    frameworks: {
      gdpr: { score: 92, status: 'compliant' },
      pci: { score: 78, status: 'partial' },
      hipaa: { score: 88, status: 'compliant' },
      soc2: { score: 85, status: 'compliant' }
    },
    audits: [
      { date: '2024-01-15', type: 'GDPR', result: 'Pass', auditor: 'External' },
      { date: '2024-02-01', type: 'Security', result: 'Pass', auditor: 'Internal' },
      { date: '2024-02-15', type: 'PCI-DSS', result: 'Partial', auditor: 'External' }
    ],
    policies: [
      { name: 'Data Protection Policy', status: 'active', lastUpdated: '2024-01-01' },
      { name: 'Security Policy', status: 'active', lastUpdated: '2024-01-15' },
      { name: 'Privacy Policy', status: 'active', lastUpdated: '2024-02-01' },
      { name: 'Incident Response Plan', status: 'review', lastUpdated: '2023-12-15' }
    ],
    requirements: [
      { id: 1, name: 'Data Encryption', status: 'compliant', category: 'Security' },
      { id: 2, name: 'Access Controls', status: 'compliant', category: 'Security' },
      { id: 3, name: 'Audit Logging', status: 'compliant', category: 'Monitoring' },
      { id: 4, name: 'Data Retention', status: 'partial', category: 'Data Management' },
      { id: 5, name: 'User Consent', status: 'compliant', category: 'Privacy' },
      { id: 6, name: 'Right to Delete', status: 'compliant', category: 'Privacy' }
    ]
  }

  const data = complianceData || mockCompliance

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Center</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage regulatory compliance
          </p>
        </div>
        <Button onClick={fetchComplianceData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={data.overall} className="h-4" />
            </div>
            <span className="text-2xl font-bold">{data.overall}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Framework Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(data.frameworks).map(([framework, info]: any) => (
          <Card key={framework}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium uppercase">
                  {framework}
                </CardTitle>
                <Badge
                  variant={info.status === 'compliant' ? 'default' : 'secondary'}
                >
                  {info.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{info.score}%</div>
              <Progress value={info.score} className="mt-2 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requirements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>
                Track compliance with specific regulatory requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.requirements.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {req.status === 'compliant' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : req.status === 'partial' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{req.name}</p>
                        <p className="text-sm text-muted-foreground">{req.category}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        req.status === 'compliant' ? 'default' :
                        req.status === 'partial' ? 'secondary' : 'destructive'
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Policies</CardTitle>
              <CardDescription>
                Manage organizational compliance policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.policies.map((policy: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{policy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {policy.lastUpdated}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={policy.status === 'active' ? 'default' : 'secondary'}
                      >
                        {policy.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                Recent compliance audits and assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.audits.map((audit: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{audit.type} Audit</p>
                        <p className="text-sm text-muted-foreground">
                          {audit.date} • {audit.auditor}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={audit.result === 'Pass' ? 'default' : 'secondary'}
                    >
                      {audit.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
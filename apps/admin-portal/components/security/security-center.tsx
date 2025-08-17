'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  User,
  Activity
} from 'lucide-react'

export function SecurityCenter() {
  const [securityScore, setSecurityScore] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [compliance, setCompliance] = useState<any>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [scoreRes, auditRes, complianceRes, incidentsRes] = await Promise.all([
        fetch('/api/security/score'),
        fetch('/api/security/audit-logs?limit=50'),
        fetch('/api/security/compliance'),
        fetch('/api/security/incidents')
      ])

      setSecurityScore(await scoreRes.json())
      setAuditLogs((await auditRes.json()).logs)
      setCompliance(await complianceRes.json())
      setIncidents(await incidentsRes.json())
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGrade = (score: number) => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  if (loading) {
    return <div className="animate-pulse">Loading security data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Security & Compliance Center</h2>
        <Button onClick={fetchSecurityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`text-6xl font-bold ${getScoreColor(securityScore?.score || 0)}`}>
                {securityScore?.score || 0}
              </div>
              <div>
                <div className="text-2xl font-semibold">Grade: {getGrade(securityScore?.score || 0)}</div>
                <div className="text-sm text-muted-foreground">
                  {securityScore?.trend === 'improving' ? '↑ Improving' : 
                   securityScore?.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(securityScore?.categories || {}).map(([category, score]) => (
                <div key={category} className="text-sm">
                  <div className="flex justify-between">
                    <span className="capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium">{score as number}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full ${
                        (score as number) >= 80 ? 'bg-green-500' :
                        (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Risks */}
          {securityScore?.risks?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Security Risks</h4>
              <div className="space-y-2">
                {securityScore.risks.slice(0, 3).map((risk: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{risk.title}</div>
                      <div className="text-xs text-muted-foreground">{risk.description}</div>
                      <Badge 
                        variant={risk.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {risk.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {securityScore?.recommendations?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recommendations</h4>
              <div className="space-y-2">
                {securityScore.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{rec.title}</div>
                      <div className="text-xs text-muted-foreground">{rec.description}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{rec.effort} effort</Badge>
                        <Badge variant="outline">{rec.impact} impact</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed sections */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Audit Logs</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">
                          {log.action.replace(/_/g, ' ').replace(/\./g, ' → ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.resource} {log.resourceId && `(${log.resourceId.slice(0, 8)}...)`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{log.user?.email || 'System'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['GDPR', 'CCPA', 'SOC2', 'ISO27001', 'HIPAA', 'PCI-DSS'].map((standard) => (
                  <div key={standard} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{standard}</h4>
                      {compliance?.[standard.toLowerCase()]?.enabled ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {compliance?.[standard.toLowerCase()]?.score || 0}% Compliant
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${compliance?.[standard.toLowerCase()]?.score || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No active security incidents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident: any) => (
                    <div key={incident.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{incident.title}</h4>
                          <p className="text-sm text-muted-foreground">{incident.description}</p>
                        </div>
                        <Badge 
                          variant={
                            incident.severity === 'critical' ? 'destructive' :
                            incident.severity === 'high' ? 'destructive' :
                            incident.severity === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {incident.severity}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          Detected {new Date(incident.detectedAt).toLocaleString()}
                        </div>
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Require 2FA for all users</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4" />
                    <div>
                      <div className="font-medium">SSO/SAML</div>
                      <div className="text-sm text-muted-foreground">Single Sign-On integration</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">IP Whitelisting</div>
                      <div className="text-sm text-muted-foreground">Restrict access by IP address</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
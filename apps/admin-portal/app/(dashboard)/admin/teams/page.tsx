'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  Activity,
  Settings,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  HardDrive,
  Zap,
  RefreshCw
} from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  lastActive: string | null
  avatar: string | null
}

interface Invitation {
  id: string
  email: string
  role: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired'
}

interface TeamData {
  organization: {
    id: string
    name: string
    plan: string
    licenseKey: string
  }
  members: TeamMember[]
  invitations: Invitation[]
  stats: {
    totalMembers: number
    activeMembers: number
    pendingInvitations: number
    monthlyActiveUsers: number
    storageUsed: number
    apiCallsThisMonth: number
  }
}

export default function TeamsPage() {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteName, setInviteName] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeamData(data)
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    try {
      setSending(true)
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteName,
        }),
      })
      
      if (response.ok) {
        setInviteDialogOpen(false)
        setInviteEmail('')
        setInviteName('')
        setInviteRole('member')
        await fetchTeamData()
      }
    } catch (error) {
      console.error('Failed to send invitation:', error)
    } finally {
      setSending(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'destructive'
      case 'admin':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'pending':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getTimeAgo = (date: string | null) => {
    if (!date) return 'Never'
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
    return Math.floor(seconds / 86400) + ' days ago'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load team data</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-gray-500">Manage your organization and team members</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendInvitation} disabled={!inviteEmail || sending}>
                {sending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Overview</CardTitle>
          <CardDescription>Your organization details and usage statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Organization</p>
              <p className="font-medium">{teamData.organization.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Plan</p>
              <Badge>{teamData.organization.plan}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">License Key</p>
              <p className="font-mono text-sm">{teamData.organization.licenseKey}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Organization ID</p>
              <p className="font-mono text-sm">{teamData.organization.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {teamData.stats.activeMembers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.stats.monthlyActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(teamData.stats.storageUsed)}</div>
            <p className="text-xs text-muted-foreground">
              Of 10 GB limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.stats.apiCallsThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Active Members</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getTimeAgo(member.lastActive)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Manage pending team invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {teamData.invitations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Invited By</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamData.invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge>{invitation.role}</Badge>
                        </TableCell>
                        <TableCell>{invitation.invitedBy}</TableCell>
                        <TableCell>{new Date(invitation.invitedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Resend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending invitations</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    Send First Invitation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent team activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                  <div>
                    <p className="font-medium">Sarah Johnson joined the team</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Shield className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium">Mike Chen&apos;s role changed to Admin</p>
                    <p className="text-sm text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Invitation sent to john@company.com</p>
                    <p className="text-sm text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
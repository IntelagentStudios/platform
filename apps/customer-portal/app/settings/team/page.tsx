'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Plus, Mail, Shield, Trash2, Edit, 
  CheckCircle2, AlertCircle, UserPlus, Settings,
  Crown, User, Clock, Send, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'deactivated';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  permissions: string[];
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

const roleDescriptions = {
  owner: 'Full access to all features and billing',
  admin: 'Manage team, products, and settings',
  member: 'Use products and view analytics',
  viewer: 'View-only access to dashboard and reports'
};

const rolePermissions = {
  owner: ['all'],
  admin: ['team.manage', 'products.manage', 'settings.manage', 'analytics.view'],
  member: ['products.use', 'analytics.view', 'settings.personal'],
  viewer: ['analytics.view', 'products.view']
};

export default function TeamPage() {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        fetch('/api/settings/team/members'),
        fetch('/api/settings/team/invitations')
      ]);

      if (membersRes.ok && invitationsRes.ok) {
        const membersData = await membersRes.json();
        const invitationsData = await invitationsRes.json();
        
        setTeamMembers(membersData.members || []);
        setInvitations(invitationsData.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team information',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        title: 'Error',
        description: 'Please enter an email and select a role',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/settings/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          message: inviteMessage
        })
      });

      if (response.ok) {
        toast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteEmail}`,
        });
        
        setInviteEmail('');
        setInviteRole('member');
        setInviteMessage('');
        setShowInviteDialog(false);
        
        await fetchTeamData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to send invitation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/settings/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast({
          title: 'Role Updated',
          description: 'Team member role has been updated',
        });
        await fetchTeamData();
        setShowEditDialog(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/team/members/${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Member Removed',
          description: 'Team member has been removed',
        });
        await fetchTeamData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive'
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/settings/team/invitations/${invitationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Invitation Cancelled',
          description: 'The invitation has been cancelled',
        });
        await fetchTeamData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive'
      });
    }
  };

  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/settings/team/invitations/${invitationId}/resend`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: 'Invitation Resent',
          description: 'A new invitation has been sent',
        });
        await fetchTeamData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />;
      case 'admin':
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'member':
        return 'outline';
      default:
        return 'ghost';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Team Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and their permissions
            </p>
          </div>
          
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {roleDescriptions[inviteRole as keyof typeof roleDescriptions]}
                  </p>
                </div>

                <div>
                  <Label>Personal Message (Optional)</Label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Add a personal message to the invitation..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                  />
                </div>

                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    An invitation email will be sent with a link to join your team
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={sendInvitation}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Invites</p>
                <p className="text-2xl font-bold">
                  {invitations.filter(i => i.status === 'pending').length}
                </p>
              </div>
              <Send className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Limit</p>
                <p className="text-2xl font-bold">{teamMembers.length}/10</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {teamMembers.map(member => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.name || member.email}</h3>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                        </Badge>
                        {member.status !== 'active' && (
                          <Badge variant="secondary">{member.status}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                        <span>Last active {new Date(member.lastActive).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {member.role !== 'owner' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {teamMembers.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Team Members Yet</h3>
                <p className="text-gray-600 mb-4">
                  Invite your first team member to start collaborating
                </p>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Your First Invitation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.filter(i => i.status === 'pending').map(invitation => (
            <Card key={invitation.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{invitation.email}</span>
                      <Badge variant="outline">{invitation.role}</Badge>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Invited by {invitation.invitedBy} on {new Date(invitation.invitedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resendInvitation(invitation.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => cancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {invitations.filter(i => i.status === 'pending').length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Pending Invitations</h3>
                <p className="text-gray-600">
                  All invitations have been accepted or expired
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Overview of what each role can do in your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(roleDescriptions).map(([role, description]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role)}
                        <h4 className="font-semibold capitalize">{role}</h4>
                      </div>
                      <Badge variant={getRoleBadgeVariant(role)}>
                        {teamMembers.filter(m => m.role === role).length} members
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                    <div className="flex flex-wrap gap-2">
                      {rolePermissions[role as keyof typeof rolePermissions].map(permission => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update role and permissions for {selectedMember?.name || selectedMember?.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Label>Role</Label>
                <Select 
                  value={selectedMember.role} 
                  onValueChange={(role) => setSelectedMember({...selectedMember, role: role as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Changing roles will immediately update the member's access permissions
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedMember && updateMemberRole(selectedMember.id, selectedMember.role)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
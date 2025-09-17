'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building,
  Globe,
  Users,
  Target,
  Zap,
  TrendingUp,
  Settings,
  Save,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';
import { useLocalization } from '@/lib/localization';

export default function CompanyProfilePage() {
  const { localize } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    companyName: '',
    website: '',
    industry: '',
    description: '',
    targetMarket: '',
    companySize: '',
    location: '',
    founded: '',
    mission: '',
    vision: '',
    valueProposition: '',
    painPoints: [] as string[],
    technologies: [] as string[],
    competitors: [] as string[],
    marketTrends: [] as string[],
    opportunities: [] as string[],
    advantages: [] as string[],
    differentiators: [] as string[],
    products: [] as string[],
  });

  const [newItem, setNewItem] = useState({
    painPoints: '',
    technologies: '',
    competitors: '',
    marketTrends: '',
    opportunities: '',
    advantages: '',
    differentiators: '',
    products: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/sales/configuration');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.configuration || profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/sales/configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: profile })
      });

      if (response.ok) {
        setEditMode(false);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    if (!profile.website) return;

    setReanalyzing(true);
    try {
      const response = await fetch('/api/sales/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: profile.website,
          useSkillsOrchestrator: true
        })
      });

      if (response.ok) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    setProfile(prev => ({
                      ...prev,
                      ...data.data
                    }));
                  }
                } catch (e) {
                  console.error('Failed to parse SSE:', e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to reanalyze:', error);
    } finally {
      setReanalyzing(false);
    }
  };

  const addItem = (field: keyof typeof newItem) => {
    if (newItem[field].trim()) {
      setProfile(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), newItem[field].trim()]
      }));
      setNewItem(prev => ({ ...prev, [field]: '' }));
    }
  };

  const removeItem = (field: string, index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof profile] as string[]).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Company Profile</h1>
          <p className="text-muted-foreground">
            Manage your company information that powers your sales campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={reanalyzing || !profile.website}
          >
            {reanalyzing ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {localize('Re-analyze')}
          </Button>
          <Button
            size="sm"
            onClick={editMode ? handleSave : () => setEditMode(true)}
            disabled={saving}
          >
            {editMode ? (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-1" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={profile.companyName}
                  onChange={e => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                  disabled={!editMode}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={profile.website}
                  onChange={e => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  disabled={!editMode}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Select
                  value={profile.industry}
                  onValueChange={value => setProfile(prev => ({ ...prev, industry: value }))}
                  disabled={!editMode}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="E-commerce">E-commerce</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Size</Label>
                <Input
                  value={profile.companySize}
                  onChange={e => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                  disabled={!editMode}
                  placeholder="e.g., 50-200 employees"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={profile.description}
                onChange={e => setProfile(prev => ({ ...prev, description: e.target.value }))}
                disabled={!editMode}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Value Proposition</Label>
              <Textarea
                value={profile.valueProposition}
                onChange={e => setProfile(prev => ({ ...prev, valueProposition: e.target.value }))}
                disabled={!editMode}
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Market Position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Target Market</Label>
              <Input
                value={profile.targetMarket}
                onChange={e => setProfile(prev => ({ ...prev, targetMarket: e.target.value }))}
                disabled={!editMode}
                className="mt-1"
              />
            </div>

            {/* Pain Points */}
            <div>
              <Label>Customer Pain Points</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.painPoints.map((item, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {item}
                    {editMode && (
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeItem('painPoints', index)}
                      />
                    )}
                  </Badge>
                ))}
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      value={newItem.painPoints}
                      onChange={e => setNewItem(prev => ({ ...prev, painPoints: e.target.value }))}
                      placeholder="Add pain point..."
                      className="w-48 h-8"
                      onKeyPress={e => e.key === 'Enter' && addItem('painPoints')}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('painPoints')}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Competitors */}
            <div>
              <Label>Competitors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.competitors.map((item, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {item}
                    {editMode && (
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeItem('competitors', index)}
                      />
                    )}
                  </Badge>
                ))}
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      value={newItem.competitors}
                      onChange={e => setNewItem(prev => ({ ...prev, competitors: e.target.value }))}
                      placeholder="Add competitor..."
                      className="w-48 h-8"
                      onKeyPress={e => e.key === 'Enter' && addItem('competitors')}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('competitors')}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Differentiators */}
            <div>
              <Label>Key Differentiators</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.differentiators.map((item, index) => (
                  <Badge key={index} className="px-3 py-1">
                    {item}
                    {editMode && (
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeItem('differentiators', index)}
                      />
                    )}
                  </Badge>
                ))}
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      value={newItem.differentiators}
                      onChange={e => setNewItem(prev => ({ ...prev, differentiators: e.target.value }))}
                      placeholder="Add differentiator..."
                      className="w-48 h-8"
                      onKeyPress={e => e.key === 'Enter' && addItem('differentiators')}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('differentiators')}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology & Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Technology & Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Technologies */}
            <div>
              <Label>Technologies Used</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.technologies.map((item, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {item}
                    {editMode && (
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeItem('technologies', index)}
                      />
                    )}
                  </Badge>
                ))}
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      value={newItem.technologies}
                      onChange={e => setNewItem(prev => ({ ...prev, technologies: e.target.value }))}
                      placeholder="Add technology..."
                      className="w-48 h-8"
                      onKeyPress={e => e.key === 'Enter' && addItem('technologies')}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('technologies')}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Market Trends */}
            <div>
              <Label>Market Trends</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.marketTrends.map((item, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {item}
                    {editMode && (
                      <X
                        className="h-3 w-3 ml-2 cursor-pointer"
                        onClick={() => removeItem('marketTrends', index)}
                      />
                    )}
                  </Badge>
                ))}
                {editMode && (
                  <div className="flex gap-2">
                    <Input
                      value={newItem.marketTrends}
                      onChange={e => setNewItem(prev => ({ ...prev, marketTrends: e.target.value }))}
                      placeholder="Add trend..."
                      className="w-48 h-8"
                      onKeyPress={e => e.key === 'Enter' && addItem('marketTrends')}
                    />
                    <Button
                      size="sm"
                      onClick={() => addItem('marketTrends')}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
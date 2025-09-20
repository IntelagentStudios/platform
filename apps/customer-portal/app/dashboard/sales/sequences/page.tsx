'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  Mail,
  Clock,
  Users,
  TrendingUp,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  ChevronRight,
  Calendar,
  Target,
  Zap,
  BarChart,
  Settings
} from 'lucide-react';

interface Sequence {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  steps: number;
  enrolled: number;
  completed: number;
  conversion: number;
  lastUpdated: string;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      id: '1',
      name: 'Cold Outreach Sequence',
      status: 'active',
      steps: 5,
      enrolled: 245,
      completed: 67,
      conversion: 27.3,
      lastUpdated: '2024-01-10'
    },
    {
      id: '2',
      name: 'Follow-up Nurture',
      status: 'active',
      steps: 7,
      enrolled: 189,
      completed: 45,
      conversion: 23.8,
      lastUpdated: '2024-01-08'
    },
    {
      id: '3',
      name: 'Re-engagement Campaign',
      status: 'paused',
      steps: 4,
      enrolled: 156,
      completed: 89,
      conversion: 15.4,
      lastUpdated: '2024-01-05'
    },
    {
      id: '4',
      name: 'Product Launch Sequence',
      status: 'draft',
      steps: 6,
      enrolled: 0,
      completed: 0,
      conversion: 0,
      lastUpdated: '2024-01-12'
    }
  ]);

  const handleDuplicate = (id: string) => {
    const sequence = sequences.find(s => s.id === id);
    if (sequence) {
      const newSequence = {
        ...sequence,
        id: Date.now().toString(),
        name: `${sequence.name} (Copy)`,
        status: 'draft' as const,
        enrolled: 0,
        completed: 0,
        conversion: 0
      };
      setSequences([...sequences, newSequence]);
      toast.success('Sequence duplicated');
    }
  };

  const handleDelete = (id: string) => {
    setSequences(sequences.filter(s => s.id !== id));
    toast.success('Sequence deleted');
  };

  const handleToggleStatus = (id: string) => {
    setSequences(sequences.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'active' ? 'paused' : 'active';
        toast.success(`Sequence ${newStatus === 'active' ? 'activated' : 'paused'}`);
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Sequences</h1>
          <p className="text-gray-400 mt-1">
            Automated multi-step campaigns to nurture leads
          </p>
        </div>
        <Link href="/dashboard/sales/sequences/new">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Sequence
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Sequences</p>
              <p className="text-2xl font-bold text-white">
                {sequences.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Enrolled</p>
              <p className="text-2xl font-bold text-white">
                {sequences.reduce((sum, s) => sum + s.enrolled, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Conversion</p>
              <p className="text-2xl font-bold text-white">
                {sequences.length > 0
                  ? (sequences.reduce((sum, s) => sum + s.conversion, 0) / sequences.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Mail className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Emails Sent Today</p>
              <p className="text-2xl font-bold text-white">342</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        {sequences.map(sequence => (
          <Card key={sequence.id} className="bg-gray-800/50 border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-semibold text-white">{sequence.name}</h3>
                  <Badge
                    variant={sequence.status === 'active' ? 'default' :
                            sequence.status === 'paused' ? 'secondary' : 'outline'}
                    className={
                      sequence.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      sequence.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-gray-600/20 text-gray-400 border-gray-600/30'
                    }
                  >
                    {sequence.status}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-400">
                    {sequence.steps} steps
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Enrolled</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {sequence.enrolled}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Completed</p>
                    <p className="text-lg font-semibold text-white">{sequence.completed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Conversion Rate</p>
                    <p className="text-lg font-semibold text-green-400">{sequence.conversion}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                    <p className="text-lg text-white flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(sequence.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Completion Progress</span>
                    <span className="text-white">
                      {sequence.enrolled > 0 ? Math.round((sequence.completed / sequence.enrolled) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={sequence.enrolled > 0 ? (sequence.completed / sequence.enrolled) * 100 : 0}
                    className="h-2 bg-gray-700"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(sequence.id)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  disabled={sequence.status === 'draft'}
                >
                  {sequence.status === 'active' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Link href={`/dashboard/sales/sequences/${sequence.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicate(sequence.id)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(sequence.id)}
                  className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Link href={`/dashboard/sales/sequences/${sequence.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                  >
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sequences.length === 0 && (
        <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
          <Mail className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No sequences yet</h3>
          <p className="text-gray-400 mb-6">
            Create your first email sequence to start nurturing leads automatically
          </p>
          <Link href="/dashboard/sales/sequences/new">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Sequence
            </Button>
          </Link>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
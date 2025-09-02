/**
 * Task Manager Skill
 * Manage tasks, projects, and productivity
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class TaskManagerSkill extends BaseSkill {
  metadata = {
    id: 'task_manager',
    name: 'Task Manager',
    description: 'Manage tasks, projects, and productivity',
    category: SkillCategory.PRODUCTIVITY,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['tasks', 'projects', 'productivity', 'management', 'planning']
  };

  private tasks: Map<string, any> = new Map();
  private projects: Map<string, any> = new Map();

  validate(params: SkillParams): boolean {
    return !!(params.action);
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        action,
        task,
        project,
        taskId,
        projectId,
        filters = {},
        updates = {}
      } = params;

      let result: any;

      switch (action) {
        case 'createTask':
          result = this.createTask(task);
          break;
        
        case 'updateTask':
          result = this.updateTask(taskId, updates);
          break;
        
        case 'deleteTask':
          result = this.deleteTask(taskId);
          break;
        
        case 'listTasks':
          result = this.listTasks(filters);
          break;
        
        case 'createProject':
          result = this.createProject(project);
          break;
        
        case 'updateProject':
          result = this.updateProject(projectId, updates);
          break;
        
        case 'assignTask':
          result = this.assignTask(taskId, updates.assignee);
          break;
        
        case 'completeTask':
          result = this.completeTask(taskId);
          break;
        
        case 'generateReport':
          result = this.generateProductivityReport(filters);
          break;
        
        case 'prioritize':
          result = this.prioritizeTasks();
          break;
        
        default:
          result = this.getOverview();
      }

      return {
        success: true,
        data: result,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private createTask(task: any): any {
    const taskId = `task_${Date.now()}`;
    const newTask = {
      id: taskId,
      title: task.title || 'New Task',
      description: task.description || '',
      status: 'pending',
      priority: task.priority || 'medium',
      assignee: task.assignee || null,
      project: task.project || null,
      dueDate: task.dueDate || null,
      tags: task.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedHours: task.estimatedHours || 0,
      actualHours: 0,
      progress: 0,
      dependencies: task.dependencies || [],
      subtasks: []
    };

    this.tasks.set(taskId, newTask);
    
    return {
      action: 'created',
      task: newTask,
      message: `Task "${newTask.title}" created successfully`
    };
  }

  private updateTask(taskId: string, updates: any): any {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date()
    };

    this.tasks.set(taskId, updatedTask);

    return {
      action: 'updated',
      task: updatedTask,
      changes: Object.keys(updates),
      message: `Task "${updatedTask.title}" updated`
    };
  }

  private deleteTask(taskId: string): any {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    this.tasks.delete(taskId);

    return {
      action: 'deleted',
      taskId,
      message: `Task "${task.title}" deleted`
    };
  }

  private listTasks(filters: any): any {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.assignee) {
      tasks = tasks.filter(t => t.assignee === filters.assignee);
    }
    if (filters.project) {
      tasks = tasks.filter(t => t.project === filters.project);
    }
    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }

    // Sort by priority and due date
    tasks.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });

    return {
      tasks,
      count: tasks.length,
      stats: this.calculateTaskStats(tasks)
    };
  }

  private createProject(project: any): any {
    const projectId = `proj_${Date.now()}`;
    const newProject = {
      id: projectId,
      name: project.name || 'New Project',
      description: project.description || '',
      status: 'planning',
      startDate: project.startDate || new Date(),
      endDate: project.endDate || null,
      team: project.team || [],
      budget: project.budget || 0,
      progress: 0,
      milestones: project.milestones || [],
      risks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(projectId, newProject);

    return {
      action: 'created',
      project: newProject,
      message: `Project "${newProject.name}" created`
    };
  }

  private updateProject(projectId: string, updates: any): any {
    const project = this.projects.get(projectId);
    
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date()
    };

    this.projects.set(projectId, updatedProject);

    return {
      action: 'updated',
      project: updatedProject,
      message: `Project "${updatedProject.name}" updated`
    };
  }

  private assignTask(taskId: string, assignee: string): any {
    return this.updateTask(taskId, { 
      assignee,
      status: 'assigned'
    });
  }

  private completeTask(taskId: string): any {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const completedTask = {
      ...task,
      status: 'completed',
      progress: 100,
      completedAt: new Date(),
      actualHours: task.estimatedHours || 1,
      updatedAt: new Date()
    };

    this.tasks.set(taskId, completedTask);

    return {
      action: 'completed',
      task: completedTask,
      message: `Task "${completedTask.title}" marked as completed`,
      stats: {
        onTime: !task.dueDate || new Date() <= new Date(task.dueDate),
        efficiency: task.estimatedHours ? 
          ((task.estimatedHours / completedTask.actualHours) * 100).toFixed(1) + '%' : 
          'N/A'
      }
    };
  }

  private generateProductivityReport(filters: any): any {
    const tasks = Array.from(this.tasks.values());
    const projects = Array.from(this.projects.values());
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = completedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    return {
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        totalProjects: projects.length
      },
      productivity: {
        completionRate: tasks.length > 0 ? 
          ((completedTasks.length / tasks.length) * 100).toFixed(1) + '%' : 
          '0%',
        efficiency: totalEstimatedHours > 0 ? 
          ((totalEstimatedHours / totalActualHours) * 100).toFixed(1) + '%' : 
          'N/A',
        averageTaskTime: completedTasks.length > 0 ? 
          (totalActualHours / completedTasks.length).toFixed(1) + ' hours' : 
          'N/A'
      },
      priorities: {
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      recommendations: [
        'Focus on high-priority tasks first',
        'Consider delegating low-priority tasks',
        'Review and update task estimates regularly',
        'Break large tasks into smaller subtasks'
      ]
    };
  }

  private prioritizeTasks(): any {
    const tasks = Array.from(this.tasks.values())
      .filter(t => t.status !== 'completed');
    
    // Score tasks based on multiple factors
    const scoredTasks = tasks.map(task => {
      let score = 0;
      
      // Priority scoring
      const priorityScores: Record<string, number> = { 
        critical: 100, 
        high: 75, 
        medium: 50, 
        low: 25 
      };
      score += priorityScores[task.priority] || 50;
      
      // Due date scoring
      if (task.dueDate) {
        const daysUntilDue = Math.floor(
          (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 1) score += 50;
        else if (daysUntilDue <= 3) score += 30;
        else if (daysUntilDue <= 7) score += 20;
      }
      
      // Progress scoring (prioritize started tasks)
      if (task.progress > 0 && task.progress < 100) {
        score += 20 + (task.progress / 5);
      }
      
      // Dependencies scoring
      if (task.dependencies && task.dependencies.length > 0) {
        score += 10;
      }
      
      return { ...task, priorityScore: score };
    });
    
    // Sort by score
    scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return {
      prioritizedTasks: scoredTasks.slice(0, 10),
      totalTasks: tasks.length,
      recommendation: scoredTasks.length > 0 ? 
        `Start with "${scoredTasks[0].title}" (Score: ${scoredTasks[0].priorityScore})` : 
        'No tasks to prioritize'
    };
  }

  private getOverview(): any {
    const tasks = Array.from(this.tasks.values());
    const projects = Array.from(this.projects.values());
    
    return {
      tasks: {
        total: tasks.length,
        byStatus: {
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length
        }
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length
      },
      recent: {
        tasks: tasks.slice(-5).reverse(),
        projects: projects.slice(-3).reverse()
      }
    };
  }

  private calculateTaskStats(tasks: any[]): any {
    return {
      byStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      byPriority: {
        critical: tasks.filter(t => t.priority === 'critical').length,
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      overdue: tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length
    };
  }

  getConfig(): Record<string, any> {
    return {
      actions: [
        'createTask', 'updateTask', 'deleteTask', 'listTasks',
        'createProject', 'updateProject', 'assignTask', 'completeTask',
        'generateReport', 'prioritize'
      ],
      taskStatuses: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      priorities: ['critical', 'high', 'medium', 'low'],
      projectStatuses: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      features: {
        subtasks: true,
        dependencies: true,
        timeTracking: true,
        collaboration: true,
        notifications: true
      }
    };
  }
}
/**
 * DateTime Skill
 * Provides date and time utilities
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';

export class DateTimeSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'datetime',
    name: 'Date & Time',
    description: 'Date and time utilities and conversions',
    category: SkillCategory.UTILITY,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['date', 'time', 'timezone', 'utility'],
    examples: [
      {
        description: 'Get current time',
        params: { action: 'now' }
      },
      {
        description: 'Format a date',
        params: { action: 'format', date: '2024-01-01', format: 'MM/DD/YYYY' }
      },
      {
        description: 'Calculate days between dates',
        params: { action: 'diff', from: '2024-01-01', to: '2024-01-31', unit: 'days' }
      }
    ]
  };
  
  validate(params: SkillParams): boolean {
    const validActions = ['now', 'format', 'diff', 'add', 'timezone'];
    return params.action && validActions.includes(params.action);
  }
  
  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      this.log('Executing date/time operation');
      
      if (!this.validate(params)) {
        return this.error('Invalid action. Valid actions: now, format, diff, add, timezone');
      }
      
      const { action } = params;
      let result: any;
      
      switch (action) {
        case 'now':
          const now = new Date();
          result = {
            iso: now.toISOString(),
            local: now.toLocaleString(),
            timestamp: now.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            parts: {
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              day: now.getDate(),
              hour: now.getHours(),
              minute: now.getMinutes(),
              second: now.getSeconds()
            }
          };
          break;
          
        case 'format':
          if (!params.date) {
            return this.error('Date parameter required for format action');
          }
          const dateToFormat = new Date(params.date);
          if (isNaN(dateToFormat.getTime())) {
            return this.error('Invalid date provided');
          }
          
          const format = params.format || 'ISO';
          switch (format) {
            case 'ISO':
              result = dateToFormat.toISOString();
              break;
            case 'local':
              result = dateToFormat.toLocaleString();
              break;
            case 'date':
              result = dateToFormat.toLocaleDateString();
              break;
            case 'time':
              result = dateToFormat.toLocaleTimeString();
              break;
            default:
              // Simple format replacement
              result = format
                .replace('YYYY', dateToFormat.getFullYear().toString())
                .replace('MM', (dateToFormat.getMonth() + 1).toString().padStart(2, '0'))
                .replace('DD', dateToFormat.getDate().toString().padStart(2, '0'))
                .replace('HH', dateToFormat.getHours().toString().padStart(2, '0'))
                .replace('mm', dateToFormat.getMinutes().toString().padStart(2, '0'))
                .replace('ss', dateToFormat.getSeconds().toString().padStart(2, '0'));
          }
          break;
          
        case 'diff':
          if (!params.from || !params.to) {
            return this.error('Both from and to dates are required for diff action');
          }
          const fromDate = new Date(params.from);
          const toDate = new Date(params.to);
          
          if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return this.error('Invalid dates provided');
          }
          
          const diffMs = toDate.getTime() - fromDate.getTime();
          const unit = params.unit || 'days';
          
          switch (unit) {
            case 'milliseconds':
              result = diffMs;
              break;
            case 'seconds':
              result = Math.floor(diffMs / 1000);
              break;
            case 'minutes':
              result = Math.floor(diffMs / (1000 * 60));
              break;
            case 'hours':
              result = Math.floor(diffMs / (1000 * 60 * 60));
              break;
            case 'days':
              result = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              break;
            case 'weeks':
              result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
              break;
            case 'months':
              result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
              break;
            case 'years':
              result = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
              break;
            default:
              return this.error('Invalid unit. Valid units: milliseconds, seconds, minutes, hours, days, weeks, months, years');
          }
          break;
          
        case 'add':
          if (!params.date || !params.amount || !params.unit) {
            return this.error('Date, amount, and unit parameters required for add action');
          }
          const baseDate = new Date(params.date);
          if (isNaN(baseDate.getTime())) {
            return this.error('Invalid date provided');
          }
          
          const amount = parseInt(params.amount);
          if (isNaN(amount)) {
            return this.error('Invalid amount provided');
          }
          
          const newDate = new Date(baseDate);
          switch (params.unit) {
            case 'seconds':
              newDate.setSeconds(newDate.getSeconds() + amount);
              break;
            case 'minutes':
              newDate.setMinutes(newDate.getMinutes() + amount);
              break;
            case 'hours':
              newDate.setHours(newDate.getHours() + amount);
              break;
            case 'days':
              newDate.setDate(newDate.getDate() + amount);
              break;
            case 'months':
              newDate.setMonth(newDate.getMonth() + amount);
              break;
            case 'years':
              newDate.setFullYear(newDate.getFullYear() + amount);
              break;
            default:
              return this.error('Invalid unit for add action');
          }
          result = {
            original: baseDate.toISOString(),
            new: newDate.toISOString(),
            added: `${amount} ${params.unit}`
          };
          break;
          
        case 'timezone':
          const timezones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];
          const currentTime = new Date();
          result = {};
          
          for (const tz of timezones) {
            result[tz] = currentTime.toLocaleString('en-US', { timeZone: tz });
          }
          break;
          
        default:
          return this.error('Unknown action');
      }
      
      return this.success(result);
      
    } catch (error: any) {
      this.log(`DateTime error: ${error.message}`, 'error');
      return this.error(`DateTime operation failed: ${error.message}`);
    }
  }
}
/**
 * Data Validator Skill
 * Validates and verifies data integrity and format
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class DataValidatorSkill extends BaseSkill {
  metadata = {
    id: 'data_validator',
    name: 'Data Validator',
    description: 'Validate and verify data integrity and format',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['validation', 'data', 'integrity', 'quality']
  };

  // Validation rules
  private validationRules: Record<string, (value: any) => { valid: boolean; message?: string }> = {
    email: (value) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        valid: regex.test(value),
        message: regex.test(value) ? undefined : 'Invalid email format'
      };
    },
    phone: (value) => {
      const cleaned = String(value).replace(/\D/g, '');
      const valid = cleaned.length >= 10 && cleaned.length <= 15;
      return {
        valid,
        message: valid ? undefined : 'Phone number must be 10-15 digits'
      };
    },
    url: (value) => {
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, message: 'Invalid URL format' };
      }
    },
    date: (value) => {
      const date = new Date(value);
      const valid = !isNaN(date.getTime());
      return {
        valid,
        message: valid ? undefined : 'Invalid date format'
      };
    },
    creditCard: (value) => {
      const cleaned = String(value).replace(/\s/g, '');
      const valid = this.validateCreditCard(cleaned);
      return {
        valid,
        message: valid ? undefined : 'Invalid credit card number'
      };
    },
    ssn: (value) => {
      const regex = /^\d{3}-?\d{2}-?\d{4}$/;
      return {
        valid: regex.test(value),
        message: regex.test(value) ? undefined : 'Invalid SSN format (XXX-XX-XXXX)'
      };
    },
    zipCode: (value) => {
      const regex = /^\d{5}(-\d{4})?$/;
      return {
        valid: regex.test(value),
        message: regex.test(value) ? undefined : 'Invalid ZIP code format'
      };
    },
    ipAddress: (value) => {
      const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      const valid = ipv4.test(value) || ipv6.test(value);
      return {
        valid,
        message: valid ? undefined : 'Invalid IP address format'
      };
    },
    uuid: (value) => {
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return {
        valid: regex.test(value),
        message: regex.test(value) ? undefined : 'Invalid UUID format'
      };
    },
    alphanumeric: (value) => {
      const regex = /^[a-zA-Z0-9]+$/;
      return {
        valid: regex.test(value),
        message: regex.test(value) ? undefined : 'Must contain only letters and numbers'
      };
    }
  };

  validate(params: SkillParams): boolean {
    return !!(params.data && (params.schema || params.validationType));
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { data, schema, validationType, strict = false } = params;
      
      let validationResults: any;
      let overallValid = true;
      const errors: any[] = [];
      const warnings: any[] = [];

      if (schema) {
        // Schema-based validation
        validationResults = this.validateAgainstSchema(data, schema);
        overallValid = validationResults.valid;
        errors.push(...validationResults.errors);
        warnings.push(...validationResults.warnings);
      } else if (validationType) {
        // Type-based validation
        validationResults = this.validateByType(data, validationType);
        overallValid = validationResults.valid;
        if (!validationResults.valid) {
          errors.push(validationResults.message);
        }
      } else {
        // Auto-detect and validate
        validationResults = this.autoValidate(data);
        overallValid = validationResults.valid;
        errors.push(...validationResults.errors);
        warnings.push(...validationResults.warnings);
      }

      // Calculate data quality score
      const qualityScore = this.calculateQualityScore(data, errors, warnings);

      // Generate recommendations
      const recommendations = this.generateRecommendations(data, errors, warnings);

      return {
        success: true,
        data: {
          valid: overallValid,
          errors,
          warnings,
          qualityScore,
          recommendations,
          validation: validationResults,
          statistics: this.getDataStatistics(data),
          dataType: this.detectDataType(data)
        },
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

  private validateAgainstSchema(data: any, schema: any): any {
    const errors: any[] = [];
    const warnings: any[] = [];
    let valid = true;

    // Validate required fields
    if (schema.required) {
      schema.required.forEach((field: string) => {
        if (!(field in data) || data[field] === null || data[field] === undefined) {
          errors.push({
            field,
            message: `Required field '${field}' is missing`,
            severity: 'error'
          });
          valid = false;
        }
      });
    }

    // Validate field types and constraints
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([field, fieldSchema]: [string, any]) => {
        if (field in data) {
          const value = data[field];
          
          // Type validation
          if (fieldSchema.type) {
            const actualType = this.getType(value);
            if (actualType !== fieldSchema.type) {
              errors.push({
                field,
                message: `Field '${field}' should be ${fieldSchema.type} but is ${actualType}`,
                severity: 'error'
              });
              valid = false;
            }
          }

          // Length validation
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors.push({
              field,
              message: `Field '${field}' is shorter than minimum length ${fieldSchema.minLength}`,
              severity: 'error'
            });
            valid = false;
          }

          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            warnings.push({
              field,
              message: `Field '${field}' exceeds recommended length ${fieldSchema.maxLength}`,
              severity: 'warning'
            });
          }

          // Range validation
          if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
            errors.push({
              field,
              message: `Field '${field}' is less than minimum value ${fieldSchema.minimum}`,
              severity: 'error'
            });
            valid = false;
          }

          if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
            errors.push({
              field,
              message: `Field '${field}' exceeds maximum value ${fieldSchema.maximum}`,
              severity: 'error'
            });
            valid = false;
          }

          // Pattern validation
          if (fieldSchema.pattern) {
            const regex = new RegExp(fieldSchema.pattern);
            if (!regex.test(value)) {
              errors.push({
                field,
                message: `Field '${field}' does not match required pattern`,
                severity: 'error'
              });
              valid = false;
            }
          }

          // Enum validation
          if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
            errors.push({
              field,
              message: `Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}`,
              severity: 'error'
            });
            valid = false;
          }
        }
      });
    }

    return { valid, errors, warnings };
  }

  private validateByType(data: any, type: string): any {
    if (this.validationRules[type]) {
      return this.validationRules[type](data);
    }

    // Generic type validation
    const actualType = this.getType(data);
    if (actualType === type) {
      return { valid: true };
    }

    return {
      valid: false,
      message: `Expected ${type} but got ${actualType}`
    };
  }

  private autoValidate(data: any): any {
    const errors: any[] = [];
    const warnings: any[] = [];
    let valid = true;

    if (typeof data === 'object' && data !== null) {
      // Validate each field based on detected type
      Object.entries(data).forEach(([field, value]) => {
        const detectedType = this.detectFieldType(field, value);
        
        if (detectedType && this.validationRules[detectedType]) {
          const result = this.validationRules[detectedType](value);
          if (!result.valid) {
            errors.push({
              field,
              message: result.message || `Invalid ${detectedType}`,
              detectedType,
              severity: 'error'
            });
            valid = false;
          }
        }

        // Check for common issues
        if (value === null || value === undefined) {
          warnings.push({
            field,
            message: `Field '${field}' is ${value === null ? 'null' : 'undefined'}`,
            severity: 'warning'
          });
        }

        if (typeof value === 'string' && value.trim() === '') {
          warnings.push({
            field,
            message: `Field '${field}' is empty`,
            severity: 'warning'
          });
        }
      });
    } else {
      // Single value validation
      const detectedType = this.detectValueType(data);
      if (detectedType && this.validationRules[detectedType]) {
        const result = this.validationRules[detectedType](data);
        if (!result.valid) {
          errors.push({
            message: result.message || `Invalid ${detectedType}`,
            detectedType,
            severity: 'error'
          });
          valid = false;
        }
      }
    }

    return { valid, errors, warnings };
  }

  private detectFieldType(field: string, value: any): string | null {
    const fieldLower = field.toLowerCase();
    
    // Detect by field name
    if (fieldLower.includes('email')) return 'email';
    if (fieldLower.includes('phone') || fieldLower.includes('tel')) return 'phone';
    if (fieldLower.includes('url') || fieldLower.includes('website')) return 'url';
    if (fieldLower.includes('date') || fieldLower.includes('time')) return 'date';
    if (fieldLower.includes('zip') || fieldLower.includes('postal')) return 'zipCode';
    if (fieldLower.includes('ssn')) return 'ssn';
    if (fieldLower.includes('ip')) return 'ipAddress';
    if (fieldLower.includes('uuid') || fieldLower.includes('guid')) return 'uuid';
    
    // Detect by value pattern
    return this.detectValueType(value);
  }

  private detectValueType(value: any): string | null {
    if (typeof value !== 'string') return null;
    
    // Try to detect based on patterns
    if (value.includes('@')) return 'email';
    if (/^[\d\s\-\+\(\)]+$/.test(value) && value.replace(/\D/g, '').length >= 10) return 'phone';
    if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
    if (/^\d{3}-?\d{2}-?\d{4}$/.test(value)) return 'ssn';
    if (/^\d{5}(-\d{4})?$/.test(value)) return 'zipCode';
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return 'ipAddress';
    
    return null;
  }

  private validateCreditCard(number: string): boolean {
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private calculateQualityScore(data: any, errors: any[], warnings: any[]): number {
    let score = 100;
    
    // Deduct points for errors and warnings
    score -= errors.length * 10;
    score -= warnings.length * 5;
    
    // Check for completeness
    if (typeof data === 'object' && data !== null) {
      const fields = Object.keys(data);
      const filledFields = fields.filter(f => 
        data[f] !== null && 
        data[f] !== undefined && 
        data[f] !== ''
      );
      const completeness = (filledFields.length / fields.length) * 100;
      score = (score + completeness) / 2;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(data: any, errors: any[], warnings: any[]): string[] {
    const recommendations: string[] = [];
    
    if (errors.length > 0) {
      recommendations.push(`Fix ${errors.length} validation error${errors.length > 1 ? 's' : ''} to ensure data integrity`);
    }
    
    if (warnings.length > 0) {
      recommendations.push(`Address ${warnings.length} warning${warnings.length > 1 ? 's' : ''} to improve data quality`);
    }
    
    // Check for missing common fields
    if (typeof data === 'object' && data !== null) {
      if (!data.id && !data._id) {
        recommendations.push('Consider adding a unique identifier field');
      }
      
      if (!data.createdAt && !data.created_at && !data.timestamp) {
        recommendations.push('Consider adding timestamp fields for audit trail');
      }
      
      if (!data.version) {
        recommendations.push('Consider adding version field for data versioning');
      }
    }
    
    return recommendations;
  }

  private getDataStatistics(data: any): any {
    const stats: any = {
      type: this.getType(data)
    };
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        stats.length = data.length;
        stats.types = [...new Set(data.map(item => this.getType(item)))];
      } else {
        stats.fieldCount = Object.keys(data).length;
        stats.filledFields = Object.keys(data).filter(k => 
          data[k] !== null && data[k] !== undefined && data[k] !== ''
        ).length;
        stats.nullFields = Object.keys(data).filter(k => data[k] === null).length;
        stats.emptyFields = Object.keys(data).filter(k => data[k] === '').length;
      }
    } else if (typeof data === 'string') {
      stats.length = data.length;
      stats.hasWhitespace = data !== data.trim();
      stats.isEmpty = data.trim() === '';
    } else if (typeof data === 'number') {
      stats.isInteger = Number.isInteger(data);
      stats.isFinite = Number.isFinite(data);
    }
    
    return stats;
  }

  private detectDataType(data: any): string {
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return 'array';
      }
      
      // Try to detect specific object types
      const keys = Object.keys(data);
      if (keys.includes('email') || keys.includes('phone') || keys.includes('name')) {
        return 'contact';
      }
      if (keys.includes('street') || keys.includes('city') || keys.includes('country')) {
        return 'address';
      }
      if (keys.includes('price') || keys.includes('amount') || keys.includes('total')) {
        return 'financial';
      }
      
      return 'object';
    }
    
    return this.getType(data);
  }

  getConfig(): Record<string, any> {
    return {
      validationTypes: Object.keys(this.validationRules),
      strictMode: false,
      autoDetect: true,
      maxErrors: 100
    };
  }
}